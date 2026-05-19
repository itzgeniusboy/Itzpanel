package com.onecore.sdk.core;

import com.onecore.sdk.utils.Logger;

/**
 * OneCore Runtime Hook.
 * Intercepts native library loading (System.loadLibrary / Runtime.load).
 */
public class OneCoreRuntimeHook {
    private static final String TAG = "OneCore-RuntimeHook";

    /**
     * Called by the native layer when a native library is being loaded via nativeLoad.
     * @param filename The path to the native library file.
     * @return The redirected path if necessary, or the original path.
     */
    public static String onNativeLoad(String filename) {
        if (filename == null) return null;

        Logger.d(TAG, "Intercepted Native Library Load: " + filename);

        // Here we can check if the library is inside our virtual filesystem and ensure paths are correct
        if (filename.contains("/data/data/") || filename.contains("/data/user/0/")) {
            String translated = OneCoreVFS.translate(filename);
            if (!translated.equals(filename)) {
                Logger.i(TAG, "Redirecting Native Library: " + filename + " -> " + translated);
                return translated;
            }
        }

        return filename;
    }
}
