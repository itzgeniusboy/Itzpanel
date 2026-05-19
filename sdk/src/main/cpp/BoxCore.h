#ifndef ONECORE_BOXCORE_H
#define ONECORE_BOXCORE_H

#include <jni.h>
#include <sys/syscall.h>
#include <linux/filter.h>
#include <linux/seccomp.h>
#include <sys/signal.h>
#include <sys/unistd.h>
#include <linux/prctl.h>
#include <sys/prctl.h>

#define VMCORE_CLASS "com/onecore/sdk/core/OneCoreNativeCore"


class BoxCore {
public:
    static JavaVM *getJavaVM();
    static int getApiLevel();
    static int getCallingUid(JNIEnv *env, int orig);
    static jstring redirectPathString(JNIEnv *env, jstring path);
    static jobject redirectPathFile(JNIEnv *env, jobject path);
    static jlongArray loadEmptyDex(JNIEnv *env);
};

#endif // ONECORE_BOXCORE_H
