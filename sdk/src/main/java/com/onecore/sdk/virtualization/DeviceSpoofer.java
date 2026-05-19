package com.onecore.sdk.virtualization;

import android.os.Build;
import com.onecore.sdk.config.ConfigManager;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

public class DeviceSpoofer {
    private static DeviceSpoofer instance;

    private DeviceSpoofer() {}

    public static synchronized DeviceSpoofer getInstance() {
        if (instance == null) {
            instance = new DeviceSpoofer();
        }
        return instance;
    }

    public void apply() {
        ConfigManager config = ConfigManager.getInstance();
        if (!config.isFeatureEnabled("enable_device_spoofer", false)) return;

        String model = config.getString("device_model", "SM-S918B");
        String manufacturer = config.getString("device_manufacturer", "samsung");
        String brand = config.getString("device_brand", "samsung");
        String product = config.getString("device_product", "dm3q");

        setField(Build.class, "MODEL", model);
        setField(Build.class, "MANUFACTURER", manufacturer);
        setField(Build.class, "BRAND", brand);
        setField(Build.class, "PRODUCT", product);
        setField(Build.class, "DEVICE", product);
    }

    private void setField(Class<?> clazz, String fieldName, Object value) {
        try {
            Field field = clazz.getDeclaredField(fieldName);
            field.setAccessible(true);

            Field modifiersField = Field.class.getDeclaredField("accessFlags");
            modifiersField.setAccessible(true);
            modifiersField.setInt(field, field.getModifiers() & ~Modifier.FINAL);

            field.set(null, value);
        } catch (Exception ignored) {}
    }
}
