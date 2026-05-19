package com.onecore.sdk.core;

import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import com.onecore.sdk.utils.Logger;

/**
 * Manages stub remapping for guest activities.
 */
public class OneCoreStubManager {
    private static final String TAG = "OneCore-StubManager";

    /**
     * Rewrites an Intent meant for a virtual app to target a stub activity in the host process.
     */
    public static Intent replaceWithStub(Intent intent, String hostPackage) {
        if (intent == null) return null;
        
        ComponentName component = intent.getComponent();
        if (component == null) return intent;
        
        String targetPkg = component.getPackageName();
        String targetClass = component.getClassName();
        
        // Only redirect if targeting an app outside the host
        if (targetPkg != null && !targetPkg.equals(hostPackage) && !targetPkg.equals("android")) {
            // Select appropriate stub process/class
            Class<?> stubClass = OneCoreProcessManager.getStubActivity(targetPkg);
            Logger.d(TAG, "Redirecting activity: " + targetClass + " via " + stubClass.getSimpleName());

            Intent stubIntent = new Intent();
            stubIntent.setComponent(new ComponentName(hostPackage, stubClass.getName()));
            
            // Pass metadata to the stub activity
            stubIntent.putExtra("target_intent", intent);
            stubIntent.putExtra("target_activity", targetClass);
            stubIntent.putExtra("target_package", targetPkg);
            
            // Mirror flags for correct launch behavior (Task management)
            stubIntent.setFlags(intent.getFlags());
            
            return stubIntent;
        }
        
        return intent;
    }
}
