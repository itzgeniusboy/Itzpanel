package android.content.pm;

import android.util.ArraySet;

/**
 * Stub for PackageUserState.
 */
public class PackageUserState {

    public boolean stopped;
    public boolean notLaunched;
    public boolean installed;
    public boolean hidden;
    public int enabled;
    public boolean blockUninstall;

    public String lastDisableAppCaller;

    public ArraySet<String> disabledComponents;
    public ArraySet<String> enabledComponents;

    public int domainVerificationStatus;
    public int appLinkGeneration;

    public PackageUserState() {
    }

    public PackageUserState(final PackageUserState o) {
        this.stopped = o.stopped;
        this.notLaunched = o.notLaunched;
        this.installed = o.installed;
        this.hidden = o.hidden;
        this.enabled = o.enabled;
        this.blockUninstall = o.blockUninstall;
        this.lastDisableAppCaller = o.lastDisableAppCaller;
        this.disabledComponents = o.disabledComponents != null ? new ArraySet<>(o.disabledComponents) : null;
        this.enabledComponents = o.enabledComponents != null ? new ArraySet<>(o.enabledComponents) : null;
        this.domainVerificationStatus = o.domainVerificationStatus;
        this.appLinkGeneration = o.appLinkGeneration;
    }

}
