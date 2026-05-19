package com.onecore.sdk.core;

import android.app.Activity;
import android.os.Bundle;
import com.onecore.sdk.utils.Logger;

/**
 * Proxy activities that host virtual app UIs in separate processes.
 */
public class StubActivity extends Activity {
    private static final String TAG = "OneCore-Stub";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Logger.i(TAG, "Stub Process Started: " + getPackageName() + " PID: " + android.os.Process.myPid());
    }

    public static class P0 extends StubActivity {}
    public static class P1 extends StubActivity {}
    public static class P2 extends StubActivity {}
}
