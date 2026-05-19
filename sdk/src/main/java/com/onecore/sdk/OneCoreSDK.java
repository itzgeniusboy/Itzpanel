package com.onecore.sdk;

import android.content.Context;
import android.content.Intent;
import com.onecore.sdk.config.ConfigManager;
import com.onecore.sdk.core.*;
import com.onecore.sdk.utils.Logger;
import com.onecore.sdk.virtualization.DeviceSpoofer;
import com.onecore.sdk.virtualization.LocationVirtualizer;
import java.io.File;

/**
 * Enterprise-grade Android Sandbox & Virtualization SDK.
 */
public class OneCoreSDK {
    private static final String TAG = "OneCoreSDK";
    private static boolean isInitialized = false;
    private static Context appContext;

    static {
        try {
            System.loadLibrary("onecore_native");
        } catch (UnsatisfiedLinkError e) {
            android.util.Log.e(TAG, "Native library onecore_native failed to load", e);
        }
    }

    /**
     * Initializes the OneCore Engine with a license key.
     */
    public static void init(Context context, String licenseKey, InstallCallback callback) {
        if (isInitialized) return;

        com.onecore.sdk.core.LicenseManager.verifyLicense(context, licenseKey, new com.onecore.sdk.core.LicenseManager.LicenseCallback() {
            @Override
            public void onSuccess() {
                init(context);
                if (callback != null) {
                    install(callback);
                }
            }

            @Override
            public void onError(String reason) {
                if (callback != null) {
                    callback.onFailure("Access Denied: " + reason);
                }
            }
        });
    }

    /**
     * Initializes the OneCore Engine. (Internal / Legacy)
     */
    public static void init(Context context) {
        if (isInitialized) return;
        
        try {
            appContext = context.getApplicationContext();
            Logger.init(true);
            
            // 1. Load Configurations
            ConfigManager.getInstance().init(appContext);
            
            // 2. Initialize Native Engine
            OneCoreNativeCore.init();
            OneCoreNativeCore.enableIO();
            
            // 3. Initialize VFS
            String vfsRoot = appContext.getFilesDir() + "/virtual";
            OneCoreVFS.init(vfsRoot);
            OneCoreVFS.setupVirtualEnv();
            
            // 4. Apply Hooks
            OneCoreActivityThreadHook.install(appContext);
            OneCoreAMSProxy.install(appContext.getPackageName());
            
            // 5. Initialize Native Hooks Manager
            NativeHookManager.initHooks(vfsRoot, appContext.getPackageName());
            NativeHook.installBinderHook();
            
            // 5. Spoofers
            DeviceSpoofer.getInstance().apply();
            LocationVirtualizer.getInstance().apply(appContext);
            
            Logger.i(TAG, "OneCore SDK successfully initialized.");
            isInitialized = true;
        } catch (Exception e) {
            Logger.e(TAG, "Initialization failed", e);
        }
    }

    /**
     * Installs and launches a virtual app.
     */
    public static boolean launchApp(File apkFile) {
        if (!isInitialized) return false;
        
        if (VirtualPackageManager.get().installAPK(apkFile)) {
            String pkgName = VirtualPackageManager.get().getPackage(apkFile.getName()).packageName; // Simplified lookup
            Intent stubIntent = new Intent();
            stubIntent.setClassName(appContext.getPackageName(), OneCoreProcessManager.getStubActivity(pkgName).getName());
            stubIntent.putExtra("target_package", pkgName);
            stubIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            appContext.startActivity(stubIntent);
            return true;
        }
        return false;
    }

    public static Context getContext() {
        return appContext;
    }

    public static boolean isInitialized() {
        return isInitialized;
    }

    public interface InstallCallback {
        void onProgress(int progress, String message);
        void onSuccess();
        void onFailure(String reason);
    }

    /**
     * Simulates a core engine installation/warmup sequence.
     */
    public static void install(InstallCallback callback) {
        new Thread(() -> {
            try {
                if (callback != null) callback.onProgress(20, "Verifying System integrity...");
                Thread.sleep(800);
                if (callback != null) callback.onProgress(50, "Bypassing hidden APIs...");
                Thread.sleep(800);
                if (callback != null) callback.onProgress(80, "Injecting VM hooks...");
                Thread.sleep(800);
                if (callback != null) callback.onProgress(100, "OneCore Engine Ready");
                if (callback != null) callback.onSuccess();
            } catch (Exception e) {
                if (callback != null) callback.onFailure(e.getMessage());
            }
        }).start();
    }
}
