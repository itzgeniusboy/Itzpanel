package com.onecore.sdk.core;

import com.onecore.sdk.utils.Logger;
import java.io.File;

/**
 * OneCore Virtual File System.
 * Manages path translation between the real system and the virtual container.
 */
public class OneCoreVFS {
    private static final String TAG = "OneCore-VFS";
    private static String virtualRoot;

    /**
     * Initializes the VFS with a root directory.
     * @param root Example: /data/data/com.onecore.loader/files/virtual/com.target.app
     */
    public static void init(String root) {
        virtualRoot = root;
        File rootDir = new File(virtualRoot);
        if (!rootDir.exists()) {
            rootDir.mkdirs();
        }
        Logger.i(TAG, "VFS Root set to: " + virtualRoot);
        
        // Sync rules with Native IO engine
        try {
            OneCoreNativeCore.addIORule("/data/data/", virtualRoot);
            OneCoreNativeCore.addIORule("/data/user/0/", virtualRoot);
            // Redirection for OBB
            OneCoreNativeCore.addIORule("/sdcard/Android/obb/", virtualRoot + "/obb/");
            OneCoreNativeCore.addIORule("/storage/emulated/0/Android/obb/", virtualRoot + "/obb/");
        } catch (Throwable ignored) {}
    }

    /**
     * Translates a guest path to a real path in the virtual container.
     */
    public static String translate(String guestPath) {
        if (guestPath == null || virtualRoot == null) return guestPath;

        // Redirect internal data path
        if (guestPath.startsWith("/data/user/") || guestPath.startsWith("/data/data/")) {
            // Very simplified translation logic
            String parts[] = guestPath.split("/");
            if (parts.length > 3) {
                String relativePart = "";
                for (int i = 4; i < parts.length; i++) {
                    relativePart += "/" + parts[i];
                }
                return virtualRoot + relativePart;
            }
        }
        
        // Redirect OBB path
        if (guestPath.contains("/Android/obb/")) {
            String parts[] = guestPath.split("/Android/obb/");
            if (parts.length > 1) {
                return virtualRoot + "/obb/" + parts[1];
            }
        }

        return guestPath;
    }

    /**
     * Ensures all necessary virtual directories (cache, files, etc.) exist.
     */
    public static void setupVirtualEnv() {
        if (virtualRoot == null) return;
        
        String[] subDirs = {"/files", "/cache", "/databases", "/shared_prefs", "/obb"};
        for (String sub : subDirs) {
            new File(virtualRoot + sub).mkdirs();
        }
    }

    public static String getVirtualRoot() {
        return virtualRoot;
    }
}
