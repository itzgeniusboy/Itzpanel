package com.onecore.sdk.core;

import android.os.Build;
import com.onecore.sdk.utils.Logger;
import java.io.File;

/**
 * OneCore Native Gateway.
 * Provides the interface for low-level virtualization and path redirection hooks.
 */
public class OneCoreNativeCore {
    private static final String TAG = "OneCore-NativeCore";

    static {
        try {
            System.loadLibrary("onecore_native");
        } catch (UnsatisfiedLinkError e) {
            Logger.e(TAG, "Failed to load onecore_native: " + e.getMessage());
        }
    }

    /**
     * Initializes the native engine with the current system API level.
     */
    public static void init() {
        init(Build.VERSION.SDK_INT);
    }

    // --- Native Methods (Called from Java) ---

    public static native void init(int apiLevel);

    public static native void enableIO();

    public static native void addIORule(String targetPath, String relocatePath);

    public static native void hideXposed();
    public static native void setFakeUid(int uid);

    public static void setHideXposed(boolean hide) {
        OneCoreVMClassLoaderHook.setHideXposed(hide);
        if (hide) {
            hideXposed();
        }
    }

    // --- Callback Methods (Called from Native) ---

    public static int getCallingUid(int orig) {
        // Return the original UID or a spoofed one for virtual apps
        return orig;
    }

    public static String redirectPath(String path) {
        return OneCoreFileSystemHook.redirectPath(path);
    }

    public static File redirectPath(File path) {
        return OneCoreFileSystemHook.redirectFile(path);
    }

    public static long[] loadEmptyDex() {
        // Support for loading empty dex if requested by hooks
        return new long[0];
    }

    /**
     * Called by the native layer when a class is being looked up.
     * Returns true if the class should be hidden.
     */
    public static boolean shouldHideClass(String className) {
        return OneCoreVMClassLoaderHook.shouldHideClass(className);
    }

    /**
     * Called by the native layer when a native library is being loaded.
     */
    public static String onNativeLoad(String filename) {
        return OneCoreRuntimeHook.onNativeLoad(filename);
    }

    /**
     * Called by the native layer when a DEX file is being opened.
     */
    public static void onOpenDexFile(String sourcePath) {
        OneCoreDexFileHook.onOpenDexFile(sourcePath);
    }
}
