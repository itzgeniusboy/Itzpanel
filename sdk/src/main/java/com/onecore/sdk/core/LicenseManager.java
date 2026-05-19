package com.onecore.sdk.core;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class LicenseManager {
    private static final String TAG = "OneCore-License";
    
    // Replace with your actual Firebase Project ID from firebase-applet-config.json
    private static final String PROJECT_ID = "gen-lang-client-0032782302";
    private static final String BASE_URL = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/licenses/";

    public interface LicenseCallback {
        void onSuccess();
        void onError(String reason);
    }

    public static void verifyLicense(Context context, String key, LicenseCallback callback) {
        new Thread(() -> {
            try {
                String deviceId = getDeviceId(context);
                String result = makeRequest(key);
                
                if (result == null) {
                    callback.onError("License key not found");
                    return;
                }

                JSONObject json = new JSONObject(result);
                JSONObject fields = json.getJSONObject("fields");
                
                String status = fields.getJSONObject("status").getString("stringValue");
                long expiresAt = fields.getJSONObject("expiresAt").getLong("integerValue");
                int maxUsage = (int) fields.getJSONObject("maxUsage").getLong("integerValue");
                int currentUsage = (int) fields.getJSONObject("currentUsage").getLong("integerValue");
                String boundDevice = fields.has("deviceId") ? 
                    fields.getJSONObject("deviceId").getString("stringValue") : null;

                if (!"active".equals(status)) {
                    callback.onError("License is " + status);
                    return;
                }

                if (System.currentTimeMillis() > expiresAt) {
                    callback.onError("License expired");
                    return;
                }

                if (currentUsage >= maxUsage) {
                    callback.onError("Usage limit exceeded (" + maxUsage + ")");
                    return;
                }

                if (boundDevice == null || boundDevice.isEmpty()) {
                    // First time binding
                    if (bindDevice(key, deviceId)) {
                        incrementUsage(key, currentUsage + 1);
                        callback.onSuccess();
                    } else {
                        callback.onError("Failed to bind device");
                    }
                } else if (!boundDevice.equals(deviceId)) {
                    callback.onError("Device mismatch. Bound to: " + boundDevice);
                } else {
                    // Success - increment usage count
                    incrementUsage(key, currentUsage + 1);
                    callback.onSuccess();
                }

            } catch (Exception e) {
                Log.e(TAG, "Verify error", e);
                callback.onError("Network error or invalid response");
            }
        }).start();
    }

    private static void incrementUsage(String key, int newCount) {
        new Thread(() -> {
            try {
                URL url = new URL(BASE_URL + key + "?updateMask.fieldPaths=currentUsage");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("X-HTTP-Method-Override", "PATCH");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                JSONObject body = new JSONObject();
                JSONObject fields = new JSONObject();
                JSONObject val = new JSONObject();
                val.put("integerValue", newCount);
                fields.put("currentUsage", val);
                body.put("fields", fields);

                conn.getOutputStream().write(body.toString().getBytes());
                conn.getResponseCode(); // Execute request
            } catch (Exception e) {
                Log.e(TAG, "Failed to increment usage", e);
            }
        }).start();
    }

    private static String getDeviceId(Context context) {
        return Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
    }

    private static String makeRequest(String key) throws Exception {
        URL url = new URL(BASE_URL + key);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        
        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = in.readLine()) != null) response.append(line);
            in.close();
            return response.toString();
        }
        return null;
    }

    private static boolean bindDevice(String key, String deviceId) throws Exception {
        // Firebase REST PATCH to update deviceId
        // This requires the correct body format for Firestore JSON
        URL url = new URL(BASE_URL + key + "?updateMask.fieldPaths=deviceId");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST"); // Use POST with X-HTTP-Method-Override or similar if needed, or just POST for create/update in some contexts. 
        // Note: Standard Firestore REST API for update is PATCH.
        conn.setRequestProperty("X-HTTP-Method-Override", "PATCH");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        JSONObject body = new JSONObject();
        JSONObject fields = new JSONObject();
        JSONObject devIdVal = new JSONObject();
        devIdVal.put("stringValue", deviceId);
        fields.put("deviceId", devIdVal);
        body.put("fields", fields);

        conn.getOutputStream().write(body.toString().getBytes());
        
        return conn.getResponseCode() == 200;
    }
}
