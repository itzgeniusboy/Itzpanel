#include "RuntimeHook.h"
#include <android/log.h>
#include "../JniHook/JniHook.h"
#include "../JniHook/ArtMethod.h"

#define TAG "OneCore-RuntimeHook"
#define ALOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)

namespace OneCore {

HOOK_JNI(jstring, nativeLoad, JNIEnv *env, jobject obj, jstring name, jobject class_loader) {
    const char *nameC = env->GetStringUTFChars(name, JNI_FALSE);
    ALOGD("nativeLoad: %s", nameC);

    jclass nativeCore = env->FindClass("com/onecore/sdk/core/OneCoreNativeCore");
    jstring redirected = name;
    if (nativeCore) {
        jmethodID onNativeLoad = env->GetStaticMethodID(nativeCore, "onNativeLoad", "(Ljava/lang/String;)Ljava/lang/String;");
        if (onNativeLoad) {
            redirected = (jstring)env->CallStaticObjectMethod(nativeCore, onNativeLoad, name);
        }
    }

    jstring result = orig_nativeLoad(env, obj, redirected, class_loader);
    env->ReleaseStringUTFChars(name, nameC);
    return result;
}

HOOK_JNI(jstring, nativeLoad2, JNIEnv *env, jobject obj, jstring name, jobject class_loader, jobject caller) {
    const char *nameC = env->GetStringUTFChars(name, JNI_FALSE);
    ALOGD("nativeLoad2: %s", nameC);

    jclass nativeCore = env->FindClass("com/onecore/sdk/core/OneCoreNativeCore");
    jstring redirected = name;
    if (nativeCore) {
        jmethodID onNativeLoad = env->GetStaticMethodID(nativeCore, "onNativeLoad", "(Ljava/lang/String;)Ljava/lang/String;");
        if (onNativeLoad) {
            redirected = (jstring)env->CallStaticObjectMethod(nativeCore, onNativeLoad, name);
        }
    }

    jstring result = orig_nativeLoad2(env, obj, redirected, class_loader, caller);
    env->ReleaseStringUTFChars(name, nameC);
    return result;
}

void RuntimeHook::init(JNIEnv *env) {
    const char *className = "java/lang/Runtime";
    // Android Q+ has a different signature for nativeLoad
    // For simplicity, we assume we know the version or check at runtime
    // In a real app, use BoxCore::getApiLevel() or similar
    
    // We try to hook both signatures to be safe if JniHook supports multi-hooking
    JniHook::HookJniFun(env, className, "nativeLoad",
                        "(Ljava/lang/String;Ljava/lang/ClassLoader;Ljava/lang/Class;)Ljava/lang/String;",
                        (void *) new_nativeLoad2,
                        (void **) (&orig_nativeLoad2), true);
    
    JniHook::HookJniFun(env, className, "nativeLoad",
                        "(Ljava/lang/String;Ljava/lang/ClassLoader;)Ljava/lang/String;",
                        (void *) new_nativeLoad,
                        (void **) (&orig_nativeLoad), true);
}

void installRuntimeHooks() {
    // Initialization path
}

} // namespace OneCore
