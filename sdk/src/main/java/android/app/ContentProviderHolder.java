package android.app;

import android.content.IContentProvider;
import android.os.IBinder;
import android.os.Parcel;
import android.os.Parcelable;

/**
 * Stub for ContentProviderHolder.
 */
public class ContentProviderHolder implements Parcelable {
    public final android.content.pm.ProviderInfo info;
    public IContentProvider provider;
    public IBinder connection;
    public boolean noReleaseNeeded;

    public ContentProviderHolder(android.content.pm.ProviderInfo _info) {
        info = _info;
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeParcelable(info, flags);
        dest.writeStrongInterface(provider);
        dest.writeStrongBinder(connection);
        dest.writeInt(noReleaseNeeded ? 1 : 0);
    }

    private ContentProviderHolder(Parcel source) {
        info = source.readParcelable(android.content.pm.ProviderInfo.class.getClassLoader());
        provider = (IContentProvider) source.readStrongBinder();
        connection = source.readStrongBinder();
        noReleaseNeeded = source.readInt() != 0;
    }

    public static final Creator<ContentProviderHolder> CREATOR = new Creator<ContentProviderHolder>() {
        @Override
        public ContentProviderHolder createFromParcel(Parcel source) {
            return new ContentProviderHolder(source);
        }

        @Override
        public ContentProviderHolder[] newArray(int size) {
            return new ContentProviderHolder[size];
        }
    };
}
