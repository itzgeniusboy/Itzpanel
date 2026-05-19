package com.onecore.sdk.core;

import java.util.HashMap;
import java.util.Map;

public class VirtualServiceManager {
    private static final Map<String, Object> services = new HashMap<>();

    public static void registerService(String name, Object service) {
        services.put(name, service);
    }

    public static Object getService(String name) {
        return services.get(name);
    }
}
