package com.onecore.sdk.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FileUtils {
    public static boolean copyFile(File src, File dst) {
        try (InputStream in = new FileInputStream(src);
             OutputStream out = new FileOutputStream(dst)) {
            byte[] buf = new byte[1024 * 64];
            int len;
            while ((len = in.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean copyDirectory(File src, File dst) {
        if (src.isDirectory()) {
            if (!dst.exists()) {
                dst.mkdirs();
            }
            String[] children = src.list();
            if (children != null) {
                for (String child : children) {
                    copyDirectory(new File(src, child), new File(dst, child));
                }
            }
            return true;
        } else {
            return copyFile(src, dst);
        }
    }
}
