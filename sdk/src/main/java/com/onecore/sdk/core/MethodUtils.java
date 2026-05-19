package com.onecore.sdk.core;

import java.lang.reflect.Method;

public class MethodUtils {
    public static String getDesc(Method method) {
        StringBuilder sb = new StringBuilder("(");
        for (Class<?> c : method.getParameterTypes()) {
            sb.append(getDescriptor(c));
        }
        sb.append(")");
        sb.append(getDescriptor(method.getReturnType()));
        return sb.toString();
    }

    public static String getDeclaringClass(Method method) {
        return method.getDeclaringClass().getName().replace(".", "/");
    }

    public static String getMethodName(Method method) {
        return method.getName();
    }

    private static String getDescriptor(Class<?> c) {
        if (c.isPrimitive()) {
            if (c == Integer.TYPE) return "I";
            if (c == Void.TYPE) return "V";
            if (c == Boolean.TYPE) return "Z";
            if (c == Byte.TYPE) return "B";
            if (c == Character.TYPE) return "C";
            if (c == Short.TYPE) return "S";
            if (c == Double.TYPE) return "D";
            if (c == Float.TYPE) return "F";
            if (c == Long.TYPE) return "J";
        }
        if (c.isArray()) return "[" + getDescriptor(c.getComponentType());
        return "L" + c.getName().replace(".", "/") + ";";
    }
}
