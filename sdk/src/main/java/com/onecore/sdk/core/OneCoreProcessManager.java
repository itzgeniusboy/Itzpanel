package com.onecore.sdk.core;

import android.os.Process;
import com.onecore.sdk.utils.Logger;
import com.onecore.sdk.utils.ReflectionHelper;
import java.util.HashMap;
import java.util.Map;

/**
 * Manages virtual process assignment for guest applications.
 */
public class OneCoreProcessManager {
    private static final String TAG = "OneCore-Process";
    private static final Map<String, Integer> packageToProcessIndex = new HashMap<>();
    
    /**
     * Map guest package to stub process index (0, 1, 2).
     */
    public static int getProcessIndex(String packageName) {
        if (!packageToProcessIndex.containsKey(packageName)) {
            int index = packageToProcessIndex.size() % 3; // Support P0, P1, P2
            packageToProcessIndex.put(packageName, index);
        }
        return packageToProcessIndex.get(packageName);
    }

    /**
     * Returns the appropriate StubActivity class for the guest package.
     */
    public static Class<?> getStubActivity(String packageName) {
        int index = getProcessIndex(packageName);
        switch (index) {
            case 0: return StubActivity.P0.class;
            case 1: return StubActivity.P1.class;
            case 2: return StubActivity.P2.class;
            default: return StubActivity.class;
        }
    }

    /**
     * Returns the appropriate StubService class for the guest package.
     */
    public static Class<?> getStubService(String packageName) {
        int index = getProcessIndex(packageName);
        switch (index) {
            case 0: return OneCoreService.P0.class;
            case 1: return OneCoreService.P1.class;
            case 2: return OneCoreService.P2.class;
            default: return OneCoreService.class;
        }
    }
    
    public static void spoofProcessName(String targetProcessName) {
        try {
            Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = ReflectionHelper.invokeMethod(null, activityThreadClass, "currentActivityThread");
            if (activityThread != null) {
                ReflectionHelper.setFieldValue(activityThread, targetProcessName, "mProcessName");
            }
            Logger.i(TAG, "Process name spoofed to: " + targetProcessName);
        } catch (Exception e) {
            Logger.e(TAG, "Failed to spoof process name", e);
        }
    }
}
