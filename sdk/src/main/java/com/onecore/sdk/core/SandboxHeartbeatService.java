package com.onecore.sdk.core;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import com.onecore.sdk.utils.Logger;

public class SandboxHeartbeatService extends Service {
    private static final String TAG = "SandboxHeartbeat";

    @Override
    public void onCreate() {
        super.onCreate();
        Logger.i(TAG, "Heartbeat Service Started");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
