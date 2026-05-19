package com.onecore.sdk.core;

import android.util.Log;
import com.onecore.sdk.VirtualContainer;
import android.os.IBinder;
import com.onecore.sdk.utils.Logger;
import com.onecore.sdk.utils.ReflectionHelper;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Proxy for IActivityManager / IActivityTaskManager to intercept startActivity.
 * Adaptive logic for Android 10-17.
 */
public class OneCoreAMSProxy implements InvocationHandler {
    private static final String TAG = "OneCore-AMSProxy";
    private final Object mBase;
    private static String sHostPackage;

    public OneCoreAMSProxy(Object base) {
        this.mBase = base;
    }

    public static void install(String hostPackage) {
        sHostPackage = hostPackage;
        SafeExecutionManager.run("AMS Hook", () -> {
            Object singleton = null;
            
            // Try ActivityTaskManager (Android 10+)
            if (SystemVersionManager.isAndroid10OrAbove()) {
                try {
                    Class<?> atmClass = Class.forName("android.app.ActivityTaskManager");
                    singleton = ReflectionHelper.getFieldValue(atmClass, "IActivityTaskManagerSingleton");
                } catch (Exception ignored) {}
            }
            
            // Fallback to ActivityManager
            if (singleton == null) {
                try {
                    Class<?> amClass = Class.forName("android.app.ActivityManager");
                    singleton = ReflectionHelper.getFieldValue(amClass, "IActivityManagerSingleton", "gDefault");
                } catch (Exception ignored) {}
            }
            
            if (singleton == null) {
                throw new RuntimeException("Could not find AMS/ATMS singleton");
            }
            
            Object rawInstance = ReflectionHelper.invokeMethod(singleton, "get");
            if (rawInstance == null) {
                rawInstance = ReflectionHelper.getFieldValue(singleton, "mInstance");
            }

            if (rawInstance == null) {
                 throw new RuntimeException("Could not get AMS instance from singleton");
            }

            // Check if already hooked
            if (rawInstance.getClass().getName().contains("com.onecore.sdk.core")) {
                Log.w(TAG, "AMS/ATMS already hooked, skipping.");
                return;
            }

            Class<?> iAmClass = null;
            for (Class<?> iface : rawInstance.getClass().getInterfaces()) {
                String name = iface.getName();
                if (name.contains("IActivityManager") || name.contains("IActivityTaskManager")) {
                    iAmClass = iface;
                    break;
                }
            }

            if (iAmClass == null) {
                 throw new RuntimeException("Could not find IActivityManager interface");
            }

            Object proxy = Proxy.newProxyInstance(
                iAmClass.getClassLoader(),
                new Class[]{iAmClass},
                new OneCoreAMSProxy(rawInstance)
            );
            
            ReflectionHelper.setFieldValue(singleton, proxy, "mInstance");
            Log.i(TAG, "OneCore-DEBUG: AMS/ATMS hooked successfully on " + SystemVersionManager.getAMServiceName());
        });
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        String methodName = method.getName();
        
        if (methodName.startsWith("startActivity")) {
             int intentIndex = findArgumentIndex(args, android.content.Intent.class);
             if (intentIndex != -1) {
                 android.content.Intent intent = (android.content.Intent) args[intentIndex];
                 if (isExternalComponent(intent)) {
                     android.content.Intent stubIntent = OneCoreStubManager.replaceWithStub(intent, sHostPackage);
                     if (stubIntent != intent) {
                         Logger.d(TAG, "Redirected Activity: " + intent.getComponent() + " -> " + stubIntent.getComponent());
                         args[intentIndex] = stubIntent;
                     }
                 }
             }
        } else if (methodName.equals("activityResumed")) {
            Logger.v(TAG, "Activity Resumed");
        } else if (methodName.contains("startService") || methodName.contains("bindService")) {
            int intentIndex = findArgumentIndex(args, android.content.Intent.class);
            if (intentIndex != -1) {
                android.content.Intent intent = (android.content.Intent) args[intentIndex];
                if (isExternalComponent(intent)) {
                    android.content.Intent stubService = wrapServiceIntent(intent);
                    if (stubService != null) {
                        args[intentIndex] = stubService;
                    }
                }
            }
        } else if (methodName.equals("getContentProvider")) {
            String name = (String) args[2];
            if (OneCoreContentProviderManager.isVirtualProvider(name)) {
                Logger.d(TAG, "Intercepting ContentProvider: " + name);
                return OneCoreContentProviderManager.getProviderHolder(name);
            }
        } else if (methodName.equals("getRunningAppProcesses")) {
            Object result = method.invoke(mBase, args);
            if (result instanceof java.util.List) {
                spoofProcessList((java.util.List) result);
            }
            return result;
        }

        try {
            return method.invoke(mBase, args);
        } catch (java.lang.reflect.InvocationTargetException e) {
            throw e.getTargetException();
        }
    }

    private int findArgumentIndex(Object[] args, Class<?> type) {
        if (args == null) return -1;
        for (int i = 0; i < args.length; i++) {
            if (args[i] != null && type.isAssignableFrom(args[i].getClass())) {
                return i;
            }
        }
        return -1;
    }

    private boolean isExternalComponent(android.content.Intent intent) {
        if (intent == null || intent.getComponent() == null) return false;
        String pkg = intent.getComponent().getPackageName();
        return !pkg.equals(sHostPackage) && !pkg.equals("android");
    }

    private android.content.Intent wrapServiceIntent(android.content.Intent intent) {
        String guestPkg = intent.getComponent().getPackageName();
        int procIndex = OneCoreProcessManager.getProcessIndex(guestPkg);
        String stubClassName = "com.onecore.sdk.core.OneCoreService$P" + procIndex;
        
        android.content.Intent stubService = new android.content.Intent();
        stubService.setClassName(sHostPackage, stubClassName);
        stubService.putExtra("target_service", intent.getComponent().getClassName());
        stubService.putExtra("target_package", guestPkg);
        return stubService;
    }

    private void spoofProcessList(java.util.List processes) {
        for (Object item : processes) {
            try {
                String procName = (String) ReflectionHelper.getFieldValue(item, "processName");
                if (procName != null && (procName.contains(sHostPackage) || procName.contains(":p"))) {
                    ReflectionHelper.setFieldValue(item, "com.onecore.target", "processName");
                }
            } catch (Exception ignored) {}
        }
    }
}
