package com.onecore.sdk.core;

import android.app.Instrumentation;
import android.content.Context;
import android.os.Handler;
import com.onecore.sdk.utils.Logger;
import com.onecore.sdk.utils.ReflectionHelper;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Hijacks the Android ActivityThread to redirect process-level operations.
 */
public class OneCoreActivityThreadHook {
    private static final String TAG = "OneCore-ATHook";
    private static Object sCurrentActivityThread;

    public static void install(Context context) {
        try {
            Logger.i(TAG, "Starting ActivityThread injection...");
            
            Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
            sCurrentActivityThread = ReflectionHelper.invokeMethod(null, activityThreadClass, "currentActivityThread");

            if (sCurrentActivityThread == null) {
                Logger.e(TAG, "Could not find current ActivityThread");
                return;
            }

            // 1. Hook Instrumentation
            hookInstrumentation();

            // 2. Hook IPackageManager
            hookPackageManager();

            // 3. Hook H (Handler)
            hookHandler();

            Logger.i(TAG, "ActivityThread injection completed.");
        } catch (Exception e) {
            Logger.e(TAG, "Failed to inject ActivityThread", e);
        }
    }

    private static void hookInstrumentation() {
        try {
            Instrumentation base = (Instrumentation) ReflectionHelper.getFieldValue(sCurrentActivityThread, "mInstrumentation");
            if (base instanceof OneCoreInstrumentation) return;

            OneCoreInstrumentation wrapper = new OneCoreInstrumentation(base);
            ReflectionHelper.setFieldValue(sCurrentActivityThread, wrapper, "mInstrumentation");
            Logger.d(TAG, "Instrumentation hook installed");
        } catch (Exception e) {
            Logger.e(TAG, "Failed to hook Instrumentation", e);
        }
    }

    private static void hookPackageManager() {
        try {
            Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
            Field sPackageManagerField = activityThreadClass.getDeclaredField("sPackageManager");
            sPackageManagerField.setAccessible(true);
            Object originalPkgManager = sPackageManagerField.get(null);
            
            if (Proxy.isProxyClass(originalPkgManager.getClass())) return;

            Object proxyPkgManager = OneCorePackageManagerProxy.create(originalPkgManager);
            sPackageManagerField.set(null, proxyPkgManager);
            Logger.d(TAG, "IPackageManager hook installed");
        } catch (Exception e) {
            Logger.e(TAG, "Failed to hook IPackageManager", e);
        }
    }

    private static void hookHandler() {
        try {
            Handler mH = (Handler) ReflectionHelper.getFieldValue(sCurrentActivityThread, "mH");
            Field mCallbackField = Handler.class.getDeclaredField("mCallback");
            mCallbackField.setAccessible(true);
            
            Handler.Callback currentCallback = (Handler.Callback) mCallbackField.get(mH);
            if (currentCallback instanceof OneCoreHandlerCallback) return;

            mCallbackField.set(mH, new OneCoreHandlerCallback(mH, currentCallback));
            Logger.d(TAG, "ActivityThread.H hook installed");
        } catch (Exception e) {
            Logger.e(TAG, "Failed to hook ActivityThread Handler", e);
        }
    }

    private static class OneCoreHandlerCallback implements Handler.Callback {
        private final Handler mBaseHandler;
        private final Handler.Callback mBaseCallback;

        public OneCoreHandlerCallback(Handler baseHandler, Handler.Callback baseCallback) {
            this.mBaseHandler = baseHandler;
            this.mBaseCallback = baseCallback;
        }

        @Override
        public boolean handleMessage(android.os.Message msg) {
            // Message codes: LAUNCH_ACTIVITY (100) or BIND_APPLICATION (110)
            if (msg.what == 100) {
                Logger.v(TAG, "Intercepted LAUNCH_ACTIVITY");
            } else if (msg.what == 110) {
                Logger.v(TAG, "Intercepted BIND_APPLICATION");
            }

            if (mBaseCallback != null) {
                return mBaseCallback.handleMessage(msg);
            }
            return false;
        }
    }

    public static Object getActivityThread() {
        return sCurrentActivityThread;
    }
}
