package com.onecore.sdk.utils;

import android.util.Log;

public class Logger {
    private static final String TAG = "OneCore";
    private static boolean debugEnabled = true;

    public static void init(boolean debug) {
        debugEnabled = debug;
    }

    public static void d(String tag, String msg) {
        if (debugEnabled) Log.d(TAG + ":" + tag, msg);
    }

    public static void i(String tag, String msg) {
        Log.i(TAG + ":" + tag, msg);
    }

    public static void w(String tag, String msg) {
        Log.w(TAG + ":" + tag, msg);
    }

    public static void e(String tag, String msg) {
        Log.e(TAG + ":" + tag, msg);
    }

    public static void e(String tag, String msg, Throwable tr) {
        Log.e(TAG + ":" + tag, msg, tr);
    }
}
