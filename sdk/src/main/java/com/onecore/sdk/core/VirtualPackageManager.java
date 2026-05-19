package com.onecore.sdk.core;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageParser;
import com.onecore.sdk.utils.Logger;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * Manages virtual apps and their component information.
 */
public class VirtualPackageManager {
    private static final String TAG = "OneCore-VPM";
    private static VirtualPackageManager instance;
    private final Map<String, PackageParser.Package> virtualPackages = new HashMap<>();

    public static synchronized VirtualPackageManager get() {
        if (instance == null) {
            instance = new VirtualPackageManager();
        }
        return instance;
    }

    /**
     * Parses and registers a virtual app from an APK file.
     */
    public boolean installAPK(File apkFile) {
        try {
            PackageParser parser = new PackageParser();
            PackageParser.Package pkg = parser.parsePackage(apkFile, 0);
            
            if (pkg == null) {
                Logger.e(TAG, "Failed to parse APK: " + apkFile.getPath());
                return false;
            }

            virtualPackages.put(pkg.packageName, pkg);
            Logger.i(TAG, "Virtual app registered: " + pkg.packageName);
            return true;
        } catch (Exception e) {
            Logger.e(TAG, "Error installing APK: " + e.getMessage());
            return false;
        }
    }

    public PackageParser.Package getPackage(String packageName) {
        return virtualPackages.get(packageName);
    }

    public boolean isVirtualApp(String packageName) {
        return virtualPackages.containsKey(packageName);
    }
}
