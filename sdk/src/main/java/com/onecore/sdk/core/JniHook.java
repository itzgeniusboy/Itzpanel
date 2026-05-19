package com.onecore.sdk.core;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * Bridge for JNI Hooking and ART internal manipulation.
 */
public class JniHook {
    public static int NATIVE_OFFSET;
    public static int NATIVE_OFFSET_2;

    public static native void nativeOffset();
    public static native void nativeOffset2();

    public static native void setAccessible(Class<?> clazz, Method method);
    public static native void setAccessible(Class<?> clazz, Field field);

    static {
        System.loadLibrary("onecore-native");
    }
}
