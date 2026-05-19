package com.onecore.sdk.core;

import com.onecore.sdk.utils.Logger;
import java.io.File;

/**
 * OneCore DexFile Hook.
 * Intercepts DEX loading and manages file permissions for virtualized apps.
 */
public class OneCoreDexFileHook {
    private static final String TAG = "OneCore-DexHook";

    /**
     * This method would be called by the Native engine when openDexFileNative is triggered.
     * We check if the DEX file belongs to our virtual environment and apply protections.
     */
    public static void onOpenDexFile(String sourcePath) {
        if (sourcePath == null) return;

        Logger.d(TAG, "Intercepted DEX Load: " + sourcePath);

        // Check if the path belongs to our virtual filesystem
        if (sourcePath.contains("/virtual/") || sourcePath.contains("/onecore/")) {
            setFilePermissions(sourcePath);
        }
    }

    /**
     * Replicates the C++ logic for setting file to read-only (chmod 0444).
     */
    private static void setFilePermissions(String filePath) {
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                Logger.w(TAG, "File does not exist: " + filePath);
                return;
            }

            // Set read-only permissions
            boolean success = file.setReadOnly();
            if (success) {
                Logger.i(TAG, "Permissions set to Read-Only for: " + filePath);
            } else {
                Logger.e(TAG, "Failed to set Read-Only permission for: " + filePath);
            }
        } catch (Exception e) {
            Logger.e(TAG, "Error applying DEX file protections", e);
        }
    }
}
