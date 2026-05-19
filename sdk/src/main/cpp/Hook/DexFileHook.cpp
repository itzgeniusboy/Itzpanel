#include "DexFileHook.h"
#include <android/log.h>
#include <sys/stat.h>
#include <string.h>
#include "../JniHook/JniHook.h"
#include "../JniHook/ArtMethod.h"

#define TAG "OneCore-DexHook"
#define ALOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)

namespace OneCore {

HOOK_JNI(jobject, openDexFileNative, JNIEnv *env, jobject obj, jstring sourceName, jstring outputName, jint flags, jobject loader, jobject elements) {
    const char *sourceNameC = env->GetStringUTFChars(sourceName, JNI_FALSE);
    ALOGD("openDexFileNative: %s", sourceNameC);

    // Call Java Hook Handler
    jclass nativeCore = env->FindClass("com/onecore/sdk/core/OneCoreNativeCore");
    if (nativeCore) {
        jmethodID onOpenDex = env->GetStaticMethodID(nativeCore, "onOpenDexFile", "(Ljava/lang/String;)V");
        if (onOpenDex) {
            env->CallStaticVoidMethod(nativeCore, onOpenDex, sourceName);
        }
    }

    if (sourceNameC && (strstr(sourceNameC, "/virtual/") != nullptr || strstr(sourceNameC, "/onecore/") != nullptr)) {
        DexFileHook::setFileReadonly(sourceNameC);
    }

    jobject orig = orig_openDexFileNative(env, obj, sourceName, outputName, flags, loader, elements);
    env->ReleaseStringUTFChars(sourceName, sourceNameC);
    return orig;
}

void DexFileHook::init(JNIEnv *env) {
    // Note: We use dalvik/system/DexFile for JNI hook as suggested in user snippet
    const char *clazz = "dalvik/system/DexFile";
    JniHook::HookJniFun(env, clazz, "openDexFileNative", "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/ClassLoader;[Ldalvik/system/DexPathList$Element;)Ljava/lang/Object;", 
                        (void *) new_openDexFileNative, (void **) (&orig_openDexFileNative), true);
}

void DexFileHook::setFileReadonly(const char* filePath) {
    struct stat fileStat;
    if (stat(filePath, &fileStat) != 0) {
        return;
    }
    // chmod 0444 (Read only)
    chmod(filePath, S_IRUSR | S_IRGRP | S_IROTH);
}

void installDexHooks() {
    // This would be called from JNI_OnLoad via some initialization path
}

} // namespace OneCore
