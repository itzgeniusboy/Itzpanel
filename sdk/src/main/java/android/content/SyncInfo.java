package android.content;

import android.accounts.Account;
import android.os.Parcel;
import android.os.Parcelable;

/**
 * Information about the sync operation that is currently underway.
 */
public class SyncInfo implements Parcelable {
    private static final Account REDACTED_ACCOUNT = new Account("*****", "*****");

    public final int authorityId;
    public final Account account;
    public final String authority;
    public final long startTime;

    public SyncInfo(int authorityId, Account account, String authority, long startTime) {
        this.authorityId = authorityId;
        this.account = account;
        this.authority = authority;
        this.startTime = startTime;
    }

    public int describeContents() {
        return 0;
    }

    public void writeToParcel(Parcel parcel, int flags) {
        parcel.writeInt(authorityId);
        parcel.writeParcelable(account, flags);
        parcel.writeString(authority);
        parcel.writeLong(startTime);
    }

    SyncInfo(Parcel parcel) {
        authorityId = parcel.readInt();
        account = parcel.readParcelable(Account.class.getClassLoader());
        authority = parcel.readString();
        startTime = parcel.readLong();
    }

    public static final Creator<SyncInfo> CREATOR = new Creator<SyncInfo>() {
        public SyncInfo createFromParcel(Parcel in) {
            return new SyncInfo(in);
        }

        public SyncInfo[] newArray(int size) {
            return new SyncInfo[size];
        }
    };
}
