package com.onecore.sdk.core;

import com.onecore.sdk.utils.Logger;

/**
 * OneCore VMClassLoader Hook.
 * Prevents detection of certain libraries (like Xposed) by intercepting class lookups.
 */
public class OneCoreVMClassLoaderHook {
    private static final String TAG = "OneCore-VMHook";
    private static boolean hideXposed = false;

    /**
     * Enables anti-detection for Xposed and related frameworks.
     */
    public static void setHideXposed(boolean hide) {
        hideXposed = hide;
        Logger.i(TAG, "Anti-Xposed detection state: " + hide);
    }

    /**
     * Called by the native layer during ClassLoader.findLoadedClass.
     * @param className The name of the class being searched for.
     * @return true if the class should be hidden (returning null to caller), false otherwise.
     */
    public static boolean shouldHideClass(String className) {
        if (!hideXposed || className == null) return false;

        if (className.contains("de.robv.android.xposed") ||
            className.contains("me.weishu.epic") ||
            className.contains("me.weishu.exposed") ||
            className.contains("com.topjohnwu.magisk")) {
            
            Logger.d(TAG, "Hiding protected class: " + className);
            return true;
        }

        return false;
    }
}
