package com.onecore.sdk;

import android.view.Surface;
import com.onecore.sdk.utils.Logger;

/**
 * Native Hook Controller for the OneCore Engine.
 * Manages low-level syscall redirection and frame interception.
 */
public class NativeHookManager {
    private static final String TAG = "OneCore-NativeHook";

    static {
        try {
            System.loadLibrary("onecore_native");
        } catch (UnsatisfiedLinkError e) {
            Logger.e(TAG, "Native library onecore_native load failed: " + e.getMessage());
        }
    }

    /**
     * Initializes the native hook engine.
     * @param virtualRoot The path to the virtual storage root.
     * @param packageName The package name of the target app.
     */
    public static native void initHooks(String virtualRoot, String packageName);

    /**
     * Redirects all native rendering to the specified surface.
     * Used for Stealth Virtual Display support.
     * @param surface The target surface for redirection.
     */
    public static native void setTargetSurface(Surface surface);

    /**
     * Injects a specific library name to be hidden from system scans.
     * @param libName The name of the library (e.g. "libonecore_native.so").
     */
    public static native void addHiddenLibrary(String libName);

    /**
     * Enables or disables advanced anti-detection shields.
     */
    public static native void setAntiDetectionEnabled(boolean enabled);
}
