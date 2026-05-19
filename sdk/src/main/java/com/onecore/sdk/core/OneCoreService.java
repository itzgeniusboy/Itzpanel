package com.onecore.sdk.core;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import com.onecore.sdk.utils.Logger;

/**
 * Proxy services for running virtual app background logic.
 */
public class OneCoreService extends Service {
    private static final String TAG = "OneCore-Service";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Logger.d(TAG, "Service Stub Started in process: " + android.os.Process.myPid());
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public static class P0 extends OneCoreService {}
    public static class P1 extends OneCoreService {}
    public static class P2 extends OneCoreService {}
}
