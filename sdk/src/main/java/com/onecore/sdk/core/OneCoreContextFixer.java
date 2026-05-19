package com.onecore.sdk.core;

import android.content.Context;
import android.content.ContextWrapper;
import com.onecore.sdk.utils.Logger;
import java.lang.reflect.Field;

/**
 * Utility to fix the Context of virtualized components.
 * Swaps internal fields to ensure getPackageName() returns the virtual app's ID.
 */
public class OneCoreContextFixer {
    private static final String TAG = "OneCore-CtxFixer";

    public static void fix(Context context) {
        if (context == null) return;

        try {
            // Traverse ContextWrapper chain to find the base context
            Context base = context;
            while (base instanceof ContextWrapper) {
                base = ((ContextWrapper) base).getBaseContext();
            }

            String virtualPkg = "com.onecore.target"; // This would be dynamic in a real scenario
            
            // Fix mPackageName in ContextImpl (Internal Android class)
            Field pkgField = base.getClass().getDeclaredField("mPackageName");
            pkgField.setAccessible(true);
            pkgField.set(base, virtualPkg);
            
            Logger.d(TAG, "Context package fixed to: " + virtualPkg);
        } catch (Exception e) {
            Logger.w(TAG, "Non-critical: Could not fix context package name: " + e.getMessage());
        }
    }
}
