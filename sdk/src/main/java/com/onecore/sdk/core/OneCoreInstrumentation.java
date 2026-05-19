package com.onecore.sdk.core;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.os.Bundle;
import android.os.IBinder;
import com.onecore.sdk.utils.Logger;

/**
 * Proxy Instrumentation that intercepts Activity creation.
 * Used to 'fix' the context and package identity of virtual apps.
 */
public class OneCoreInstrumentation extends Instrumentation {
    private static final String TAG = "OneCore-Inst";
    private final Instrumentation mBase;

    public OneCoreInstrumentation(Instrumentation base) {
        this.mBase = base;
    }

    @Override
    public Activity newActivity(ClassLoader cl, String className, Intent intent) 
            throws InstantiationException, IllegalAccessException, ClassNotFoundException {
        Logger.d(TAG, "Creating activity: " + className);
        return mBase.newActivity(cl, className, intent);
    }

    @Override
    public void callActivityOnCreate(Activity activity, Bundle icicle) {
        Logger.i(TAG, "Activity onPreCreate: " + activity.getClass().getName());
        
        // Apply virtualization fixes before the app starts initializing its UI
        OneCoreContextFixer.fix(activity);
        
        try {
            mBase.callActivityOnCreate(activity, icicle);
        } catch (Exception e) {
            Logger.e(TAG, "Crash intercepted in virtual activity: " + e.getMessage());
            throw e;
        }
    }

    // Proxy other essential methods as needed to maintain stability
    public void onDestroy() { mBase.onDestroy(); }
}
