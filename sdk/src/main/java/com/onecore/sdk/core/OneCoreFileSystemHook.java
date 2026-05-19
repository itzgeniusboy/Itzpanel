package com.onecore.sdk.core;

import com.onecore.sdk.utils.Logger;
import java.io.File;

/**
 * OneCore FileSystem Hook Backend.
 * Replicates the logic of UnixFileSystemHook.cpp by providing 
 * virtualized paths for all standard Java IO operations.
 */
public class OneCoreFileSystemHook {
    private static final String TAG = "OneCore-FSHook";

    /**
     * This is the core logic called from the native UnixFileSystem hooks.
     * It ensures any file operation (list, create, delete, etc.) is redirected to the Sandbox.
     */
    public static String redirectPath(String path) {
        if (path == null) return null;
        
        String translated = OneCoreVFS.translate(path);
        
        if (!translated.equals(path)) {
            Logger.v(TAG, "IO Redirect: " + path + " -> " + translated);
        }
        return translated;
    }

    /**
     * Version for File objects.
     */
    public static File redirectFile(File file) {
        if (file == null) return null;
        String translated = redirectPath(file.getPath());
        return new File(translated);
    }

    /**
     * Logic for 'list' operations (list0 in JNI).
     * Ensures virtual directory contents are merged if necessary.
     */
    public static String[] onList(File file) {
        File redirected = redirectFile(file);
        return redirected.list();
    }
}
