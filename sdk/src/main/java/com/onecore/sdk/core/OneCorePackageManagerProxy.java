package com.onecore.sdk.core;

import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageParser;
import android.content.pm.ServiceInfo;
import com.onecore.sdk.utils.Logger;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Proxy for IPackageManager to spoof package metadata for virtual apps.
 */
public class OneCorePackageManagerProxy implements InvocationHandler {
    private static final String TAG = "OneCore-PKMProxy";
    private final Object mBase;

    public OneCorePackageManagerProxy(Object base) {
        this.mBase = base;
    }

    public static Object create(Object original) {
        try {
            Class<?> iPackageManagerClass = Class.forName("android.content.pm.IPackageManager");
            return Proxy.newProxyInstance(
                iPackageManagerClass.getClassLoader(),
                new Class[]{iPackageManagerClass},
                new OneCorePackageManagerProxy(original)
            );
        } catch (Exception e) {
            Logger.e(TAG, "Failed to create IPackageManager proxy", e);
            return original;
        }
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        String name = method.getName();
        
        if (name.equals("getPackageInfo")) {
            String pkgName = (String) args[0];
            if (VirtualPackageManager.get().isVirtualApp(pkgName)) {
                Logger.v(TAG, "Spoofing getPackageInfo for: " + pkgName);
                return createPackageInfo(pkgName);
            }
        } else if (name.equals("getApplicationInfo")) {
            String pkgName = (String) args[0];
            if (VirtualPackageManager.get().isVirtualApp(pkgName)) {
                PackageParser.Package pkg = VirtualPackageManager.get().getPackage(pkgName);
                if (pkg != null) return pkg.applicationInfo;
            }
        } else if (name.equals("getActivityInfo")) {
            // Logic to find ActivityInfo in our VirtualPackageManager
        }

        return method.invoke(mBase, args);
    }

    private PackageInfo createPackageInfo(String packageName) {
        PackageParser.Package pkg = VirtualPackageManager.get().getPackage(packageName);
        if (pkg == null) return null;

        PackageInfo info = new PackageInfo();
        info.packageName = pkg.packageName;
        info.applicationInfo = pkg.applicationInfo;
        // In a real VXP, we would map all components here
        return info;
    }
}
