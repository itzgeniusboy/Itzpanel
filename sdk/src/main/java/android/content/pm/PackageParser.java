package android.content.pm;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.IntentFilter;
import android.content.res.TypedArray;
import android.os.Bundle;
import android.util.ArrayMap;
import android.util.ArraySet;
import android.util.DisplayMetrics;

import java.io.File;
import java.io.PrintWriter;
import java.security.PublicKey;
import java.security.cert.Certificate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Stub classes for internal PackageParser to allow compile-time access.
 */
public class PackageParser {

    public final static int PARSE_IS_SYSTEM = 1 << 0;
    public final static int PARSE_CHATTY = 1 << 1;
    public final static int PARSE_MUST_BE_APK = 1 << 2;
    public final static int PARSE_IGNORE_PROCESSES = 1 << 3;
    public final static int PARSE_FORWARD_LOCK = 1 << 4;
    public final static int PARSE_EXTERNAL_STORAGE = 1 << 5;
    public final static int PARSE_IS_SYSTEM_DIR = 1 << 6;
    public final static int PARSE_IS_PRIVILEGED = 1 << 7;
    public final static int PARSE_COLLECT_CERTIFICATES = 1 << 8;
    public final static int PARSE_TRUSTED_OVERLAY = 1 << 9;

    public static class NewPermissionInfo {
        public final String name;
        public final int sdkVersion;
        public final int fileVersion;

        public NewPermissionInfo(String name, int sdkVersion, int fileVersion) {
            this.name = name;
            this.sdkVersion = sdkVersion;
            this.fileVersion = fileVersion;
        }
    }

    public static class SplitPermissionInfo {
        public final String rootPerm;
        public final String[] newPerms;
        public final int targetSdk;

        public SplitPermissionInfo(String rootPerm, String[] newPerms, int targetSdk) {
            this.rootPerm = rootPerm;
            this.newPerms = newPerms;
            this.targetSdk = targetSdk;
        }
    }

    public static class PackageLite {
        public final String packageName;
        public final int versionCode;
        public final int installLocation;
        public final VerifierInfo[] verifiers;
        public final String[] splitNames;
        public final String codePath;
        public final String baseCodePath;
        public final String[] splitCodePaths;
        public final int baseRevisionCode;
        public final int[] splitRevisionCodes;
        public final boolean coreApp;
        public final boolean multiArch;
        public final boolean extractNativeLibs;

        public PackageLite(String codePath, ApkLite baseApk, String[] splitNames, String[] splitCodePaths, int[] splitRevisionCodes) {
            throw new RuntimeException("Stub!");
        }
    }

    public static class ApkLite {
        public final String codePath;
        public final String packageName;
        public final String splitName;
        public final int versionCode;
        public final int revisionCode;
        public final int installLocation;
        public final VerifierInfo[] verifiers;
        public final Signature[] signatures;
        public final boolean coreApp;
        public final boolean multiArch;
        public final boolean extractNativeLibs;

        public ApkLite(String codePath, String packageName, String splitName, int versionCode, int revisionCode, int installLocation, List<VerifierInfo> verifiers, Signature[] signatures, boolean coreApp, boolean multiArch, boolean extractNativeLibs) {
            throw new RuntimeException("Stub!");
        }
    }

    public PackageParser() {}

    public Package parsePackage(File packageFile, int flags) throws Exception {
        throw new RuntimeException("Stub!");
    }

    public void collectCertificates(Package pkg, int flags) throws Exception {
        throw new RuntimeException("Stub!");
    }

    public final static class Package {
        public String packageName;
        public ApplicationInfo applicationInfo = new ApplicationInfo();
        public final ArrayList<Permission> permissions = new ArrayList<>(0);
        public final ArrayList<Activity> activities = new ArrayList<>(0);
        public final ArrayList<Activity> receivers = new ArrayList<>(0);
        public final ArrayList<Provider> providers = new ArrayList<>(0);
        public final ArrayList<Service> services = new ArrayList<>(0);
        public final ArrayList<Instrumentation> instrumentation = new ArrayList<>(0);
        public final ArrayList<String> requestedPermissions = new ArrayList<>();
        public Signature[] mSignatures;

        public Package(String packageName) {
            this.packageName = packageName;
        }
    }

    public static class Component<II extends IntentInfo> {
        public final Package owner;
        public final ArrayList<II> intents;
        public final String className;
        public Bundle metaData;
        public ComponentName componentName;

        public Component(Package owner) {
            this.owner = owner;
            this.intents = new ArrayList<>();
            this.className = null;
        }
    }

    public final static class Permission extends Component<IntentInfo> {
        public final PermissionInfo info;
        public Permission(Package owner, PermissionInfo info) {
            super(owner);
            this.info = info;
        }
    }

    public final static class Activity extends Component<ActivityIntentInfo> {
        public final ActivityInfo info;
        public Activity(Package owner, ActivityInfo info) {
            super(owner);
            this.info = info;
        }
    }

    public final static class Service extends Component<ServiceIntentInfo> {
        public final ServiceInfo info;
        public Service(Package owner, ServiceInfo info) {
            super(owner);
            this.info = info;
        }
    }

    public final static class Provider extends Component<ProviderIntentInfo> {
        public final ProviderInfo info;
        public Provider(Package owner, ProviderInfo info) {
            super(owner);
            this.info = info;
        }
    }

    public final static class Instrumentation extends Component<IntentInfo> {
        public final InstrumentationInfo info;
        public Instrumentation(Package owner, InstrumentationInfo info) {
            super(owner);
            this.info = info;
        }
    }

    public static class IntentInfo extends IntentFilter {}
    public static class ActivityIntentInfo extends IntentInfo {}
    public static class ServiceIntentInfo extends IntentInfo {}
    public static class ProviderIntentInfo extends IntentInfo {}
    
    public static class SigningDetails {
        public Signature[] signatures;
    }

    public static class PackageParserException extends Exception {}
}
