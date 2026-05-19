package com.onecore.sdk;

import com.onecore.sdk.utils.Logger;

/**
 * Low-level Native Function Hooking and Memory Access.
 */
public class NativeHook {
    private static final String TAG = "OneCore-NativeHook";

    static {
        try {
            System.loadLibrary("onecore_native");
        } catch (UnsatisfiedLinkError e) {
            Logger.e(TAG, "Native library load failed: " + e.getMessage());
        }
    }

    /**
     * Hooks a native function.
     * @param target Address of the original function.
     * @param replace Address of the replacement function.
     * @return Address of the original function (trampoline).
     */
    public static native long hookFunction(long target, long replace);

    /**
     * Reads memory from the current process.
     */
    public static native byte[] readMemoryNative(long addr, int size);

    /**
     * Writes memory to the current process.
     */
    public static native boolean writeMemoryNative(long addr, byte[] data);

    /**
     * Installs hooks for the Android Binder system.
     */
    public static native void installBinderHook();
}
