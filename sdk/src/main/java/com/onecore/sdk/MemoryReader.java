package com.onecore.sdk;

import com.onecore.sdk.utils.Logger;

/**
 * Native Memory Scanning and Module Analysis.
 */
public class MemoryReader {
    private static final String TAG = "OneCore-MemoryReader";

    static {
        try {
            System.loadLibrary("onecore_native");
        } catch (UnsatisfiedLinkError e) {
            Logger.e(TAG, "Native library load failed: " + e.getMessage());
        }
    }

    /**
     * Finds the base address of a loaded module.
     * @param moduleName Name of the module (e.g. "libunity.so").
     * @return Base address or 0 if not found.
     */
    public native long findModuleBase(String moduleName);

    /**
     * Scans for a byte signature in a memory range.
     * @param start Start address.
     * @param end End address.
     * @param signature Pattern (e.g. "48 89 E5 ?? ?? FF").
     * @return Address of the first match or 0.
     */
    public native long scanSignature(long start, long end, String signature);
}
