#include "VMClassLoaderHook.h"
#include <android/log.h>
#include <string.h>
#include "../JniHook/JniHook.h"

#define TAG "OneCore-VMHook"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)

namespace OneCore {

static bool g_hideXposed = false;

HOOK_JNI(jobject, findLoadedClass, JNIEnv *env, jobject obj, jobject class_loader, jstring name) {
    const char * nameC = env->GetStringUTFChars(name, JNI_FALSE);
    
    // Call Java Hook Handler to see if we should hide this class
    jclass nativeCore = env->FindClass("com/onecore/sdk/core/OneCoreNativeCore");
    if (nativeCore) {
        jmethodID shouldHide = env->GetStaticMethodID(nativeCore, "shouldHideClass", "(Ljava/lang/String;)Z");
        if (shouldHide) {
            if (env->CallStaticBooleanMethod(nativeCore, shouldHide, name)) {
                LOGD("Hiding class (via Java): %s", nameC);
                env->ReleaseStringUTFChars(name, nameC);
                return nullptr;
            }
        }
    }

    if (g_hideXposed) {
        if (nameC && (strstr(nameC, "xposed") || strstr(nameC, "epic") || strstr(nameC, "exposed"))) {
            LOGD("Hiding class (via Native): %s", nameC);
            env->ReleaseStringUTFChars(name, nameC);
            return nullptr;
        }
    }
    
    jobject result = orig_findLoadedClass(env, obj, class_loader, name);
    env->ReleaseStringUTFChars(name, nameC);
    return result;
}

void VMClassLoaderHook::init(JNIEnv *env) {
    const char *className = "java/lang/VMClassLoader";
    JniHook::HookJniFun(env, className, "findLoadedClass", "(Ljava/lang/ClassLoader;Ljava/lang/String;)Ljava/lang/Class;",
                        (void *) new_findLoadedClass,
                        (void **) (&orig_findLoadedClass), true);
}

void VMClassLoaderHook::hideXposed() {
    g_hideXposed = true;
}

} // namespace OneCore
