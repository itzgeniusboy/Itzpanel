package com.onecore.sdk.config;

import android.content.Context;
import com.onecore.sdk.utils.Logger;
import org.json.JSONObject;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class ConfigManager {
    private static final String TAG = "ConfigManager";
    private static ConfigManager instance;
    private JSONObject config;

    private ConfigManager() {
        config = new JSONObject();
    }

    public static synchronized ConfigManager getInstance() {
        if (instance == null) {
            instance = new ConfigManager();
        }
        return instance;
    }

    public void init(Context context) {
        try {
            InputStream is = context.getAssets().open("onecore_config.json");
            int size = is.available();
            byte[] buffer = new byte[size];
            is.read(buffer);
            is.close();
            String json = new String(buffer, StandardCharsets.UTF_8);
            config = new JSONObject(json);
            Logger.i(TAG, "Config initialized successfully");
        } catch (Exception e) {
            Logger.e(TAG, "Failed to load config from assets, using defaults", e);
        }
    }

    public boolean isFeatureEnabled(String featureName, boolean defaultValue) {
        return config.optBoolean(featureName, defaultValue);
    }

    public String getString(String name, String defaultValue) {
        return config.optString(name, defaultValue);
    }

    public int getInt(String name, int defaultValue) {
        return config.optInt(name, defaultValue);
    }
}
