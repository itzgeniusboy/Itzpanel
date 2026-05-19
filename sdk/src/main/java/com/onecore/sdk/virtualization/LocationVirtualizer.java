package com.onecore.sdk.virtualization;

import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.SystemClock;
import com.onecore.sdk.config.ConfigManager;
import com.onecore.sdk.utils.Logger;

public class LocationVirtualizer {
    private static final String TAG = "LocationVirtualizer";
    private static LocationVirtualizer instance;

    private LocationVirtualizer() {}

    public static synchronized LocationVirtualizer getInstance() {
        if (instance == null) {
            instance = new LocationVirtualizer();
        }
        return instance;
    }

    public void apply(Context context) {
        ConfigManager config = ConfigManager.getInstance();
        if (!config.isFeatureEnabled("enable_location_spoof", false)) return;

        double lat = Double.parseDouble(config.getString("mock_lat", "37.421998"));
        double lon = Double.parseDouble(config.getString("mock_lon", "-122.084000"));

        try {
            LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            String provider = LocationManager.GPS_PROVIDER;

            try {
                lm.addTestProvider(provider, false, false, false, false, true, true, true, 0, 5);
                lm.setTestProviderEnabled(provider, true);
            } catch (SecurityException e) {
                Logger.w(TAG, "Mock location permission missing: " + e.getMessage());
                return;
            }

            Location mockLocation = new Location(provider);
            mockLocation.setLatitude(lat);
            mockLocation.setLongitude(lon);
            mockLocation.setAltitude(0);
            mockLocation.setTime(System.currentTimeMillis());
            mockLocation.setElapsedRealtimeNanos(SystemClock.elapsedRealtimeNanos());
            mockLocation.setAccuracy(1.0f);

            lm.setTestProviderLocation(provider, mockLocation);
            Logger.i(TAG, "Mock location applied: " + lat + ", " + lon);
        } catch (Exception e) {
            Logger.e(TAG, "Failed to apply mock location", e);
        }
    }
}
