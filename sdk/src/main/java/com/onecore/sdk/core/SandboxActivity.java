package com.onecore.sdk.core;

import android.app.Activity;
import android.os.Bundle;
import com.onecore.sdk.OneCoreSDK;
import com.onecore.sdk.utils.Logger;

public class SandboxActivity extends Activity {
    private static final String TAG = "SandboxActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Logger.i(TAG, "Sandbox Process Started: " + android.os.Process.myPid());
        
        // Initialize SDK within the sandbox process
        OneCoreSDK.init(this);
        
        // Host specialized UI or logic for virtualized apps
    }
}
