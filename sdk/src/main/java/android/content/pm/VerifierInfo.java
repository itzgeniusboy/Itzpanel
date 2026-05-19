package android.content.pm;

import android.os.Parcel;
import android.os.Parcelable;
import java.security.PublicKey;

/**
 * Stub for VerifierInfo.
 */
public class VerifierInfo implements Parcelable {

    public final String packageName;
    public final PublicKey publicKey;

    public VerifierInfo(String packageName, PublicKey publicKey) {
        this.packageName = packageName;
        this.publicKey = publicKey;
    }

    private VerifierInfo(Parcel source) {
        packageName = source.readString();
        publicKey = (PublicKey) source.readSerializable();
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(packageName);
        dest.writeSerializable(publicKey);
    }

    public static final Parcelable.Creator<VerifierInfo> CREATOR = new Parcelable.Creator<VerifierInfo>() {
        public VerifierInfo createFromParcel(Parcel source) {
            return new VerifierInfo(source);
        }

        public VerifierInfo[] newArray(int size) {
            return new VerifierInfo[size];
        }
    };
}
