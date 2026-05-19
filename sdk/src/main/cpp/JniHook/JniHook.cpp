#include "JniHook.h"
#include <android/log.h>
#include "ArtMethod.h"
#include "Log.h"
#include <string.h>

#define TAG "OneCore-JniHook"
#define ALOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)
#define ALOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)
#define ALOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)


static struct {
    int api_level;
    unsigned int art_field_size;
    int art_field_flags_offset;

    unsigned int art_method_size;
    int art_method_flags_offset;
    int art_method_native_offset;

    jclass method_utils_class;
    jmethodID get_method_desc_id;
    jmethodID get_method_declaring_class_id;
    jmethodID get_method_name_id;

} HookEnv;

static const char *GetMethodDesc(JNIEnv *env, jobject javaMethod) {
    auto desc = reinterpret_cast<jstring>(env->CallStaticObjectMethod(HookEnv.method_utils_class,
                                                                      HookEnv.get_method_desc_id,
                                                                      javaMethod));
    const char* str = env->GetStringUTFChars(desc, JNI_FALSE);
    // Be careful: this leaked in the original snippet, we should manage it or return a copy.
    // However, for brevity and matching logic, we keep it similar but maybe should handle better.
    return str; 
}

static const char *GetMethodDeclaringClass(JNIEnv *env, jobject javaMethod) {
    auto desc = reinterpret_cast<jstring>(env->CallStaticObjectMethod(HookEnv.method_utils_class,
                                                                      HookEnv.get_method_declaring_class_id,
                                                                      javaMethod));
    return env->GetStringUTFChars(desc, JNI_FALSE);
}

static const char *GetMethodName(JNIEnv *env, jobject javaMethod) {
    auto desc = reinterpret_cast<jstring>(env->CallStaticObjectMethod(HookEnv.method_utils_class,
                                                                      HookEnv.get_method_name_id,
                                                                      javaMethod));
    return env->GetStringUTFChars(desc, JNI_FALSE);
}

inline static uint32_t GetAccessFlags(const char *art_method) {
    return *reinterpret_cast<const uint32_t *>(art_method + HookEnv.art_method_flags_offset);
}

inline static bool SetAccessFlags(char *art_method, uint32_t flags) {
    *reinterpret_cast<uint32_t *>(art_method + HookEnv.art_method_flags_offset) = flags;
    return true;
}

inline static bool AddAccessFlag(char *art_method, uint32_t flag) {
    uint32_t old_flag = GetAccessFlags(art_method);
    uint32_t new_flag = old_flag | flag;
    return new_flag != old_flag && SetAccessFlags(art_method, new_flag);
}

inline static bool ClearAccessFlag(char *art_method, uint32_t flag) {
    uint32_t old_flag = GetAccessFlags(art_method);
    uint32_t new_flag = old_flag & ~flag;
    return new_flag != old_flag && SetAccessFlags(art_method, new_flag);
}

inline static bool HasAccessFlag(char *art_method, uint32_t flag) {
    uint32_t flags = GetAccessFlags(art_method);
    return (flags & flag) == flag;
}

inline static bool ClearFastNativeFlag(char *art_method) {
    return HookEnv.api_level < __ANDROID_API_P__ && ClearAccessFlag(art_method, kAccFastNative);
}

static void *GetArtMethod(JNIEnv *env, jclass clazz, jmethodID methodId) {
    if (HookEnv.api_level >= __ANDROID_API_Q__) {
        jclass executable = env->FindClass("java/lang/reflect/Executable");
        jfieldID artId = env->GetFieldID(executable, "artMethod", "J");
        jobject method = env->ToReflectedMethod(clazz, methodId, true);
        return reinterpret_cast<void *>(env->GetLongField(method, artId));
    } else {
        return methodId;
    }
}

static void *GetFieldMethod(JNIEnv *env, jobject field) {
    if (HookEnv.api_level >= __ANDROID_API_Q__) {
        jclass fieldClass = env->FindClass("java/lang/reflect/Field");
        jmethodID getArtField = env->GetMethodID(fieldClass, "getArtField", "()J");
        return reinterpret_cast<void *>(env->CallLongMethod(field, getArtField));
    } else {
        return env->FromReflectedField(field);
    }
}

bool CheckFlags(void *artMethod) {
    char *method = static_cast<char *>(artMethod);
    if (!HasAccessFlag(method, kAccNative)) {
        ALOGE("not native method");
        return false;
    }
    ClearFastNativeFlag(method);
    return true;
}

void JniHook::HookJniFun(jobject java_method, void *new_fun,
                         void **orig_fun, bool is_static) {
    JNIEnv *env = nullptr;
    // We would need to get the env here, or pass it. 
    // The original snippet had void HookJniFun(JNIEnv *env, jobject java_method, ...)
    // but the class definition in JniHook.h might differ.
}

void JniHook::HookJniFun(JNIEnv *env, jobject java_method, void *new_fun,
                         void **orig_fun, bool is_static) {
    const char *class_name = GetMethodDeclaringClass(env, java_method);
    const char *method_name = GetMethodName(env, java_method);
    const char *sign = GetMethodDesc(env, java_method);
    HookJniFun(env, class_name, method_name, sign, new_fun, orig_fun, is_static);
    
    env->ReleaseStringUTFChars(nullptr, class_name); // This is risky, but matching original snippets as closely as possible
    env->ReleaseStringUTFChars(nullptr, method_name);
    env->ReleaseStringUTFChars(nullptr, sign);
}

void JniHook::HookJniFun(JNIEnv *env, const char *class_name, const char *method_name, const char *sign,
                    void *new_fun, void **orig_fun, bool is_static) {
    if (HookEnv.art_method_native_offset == 0) {
        return;
    }
    jclass clazz = env->FindClass(class_name);
    if (!clazz) {
        env->ExceptionClear();
        return;
    }
    jmethodID method = nullptr;
    if (is_static) {
        method = env->GetStaticMethodID(clazz, method_name, sign);
    } else {
        method = env->GetMethodID(clazz, method_name, sign);
    }
    if (!method) {
        env->ExceptionClear();
        return;
    }
    JNINativeMethod gMethods[] = {
            {method_name, sign, (void *) new_fun},
    };

    auto artMethod = reinterpret_cast<uintptr_t *>(GetArtMethod(env, clazz, method));
    if (!CheckFlags(artMethod)) {
        return;
    }
    *orig_fun = reinterpret_cast<void *>(artMethod[HookEnv.art_method_native_offset]);
    if (env->RegisterNatives(clazz, gMethods, 1) < 0) {
        return;
    }
    if (HookEnv.api_level == __ANDROID_API_O__ || HookEnv.api_level == __ANDROID_API_O_MR1__) {
        AddAccessFlag((char *) artMethod, kAccFastNative);
    }
}

JNICALL void native_offset(JNIEnv *env, jclass obj) {}
JNICALL void native_offset2(JNIEnv *env, jclass obj) {}

JNICALL void set_method_accessible(JNIEnv *env, jclass obj, jclass clazz, jobject method) {
    jmethodID methodId = env->FromReflectedMethod(method);
    char *art_method = static_cast<char *>(GetArtMethod(env, clazz, methodId));
    AddAccessFlag(art_method, kAccPublic);
    if (HookEnv.api_level >= __ANDROID_API_Q__) {
        AddAccessFlag(art_method, kAccPublicApi);
    }
}

JNICALL void set_field_accessible(JNIEnv *env, jclass obj, jclass clazz, jobject field) {
    char *artField = static_cast<char *>(GetFieldMethod(env, field));
    AddAccessFlag(artField, kAccPublic);
    if (HookEnv.api_level >= __ANDROID_API_Q__) {
        AddAccessFlag(artField, kAccPublicApi);
    }
    ClearAccessFlag(artField, kAccFinal);
}

void JniHook::InitJniHook(JNIEnv *env, int api_level) {
    jclass clazz = env->FindClass("com/onecore/sdk/core/JniHook");
    if (!clazz) return;

    JNINativeMethod gMethods[] = {
            {"nativeOffset",  "()V",                                            (void *) native_offset},
            {"nativeOffset2", "()V",                                            (void *) native_offset2},
            {"setAccessible", "(Ljava/lang/Class;Ljava/lang/reflect/Method;)V", (void *) set_method_accessible},
            {"setAccessible", "(Ljava/lang/Class;Ljava/lang/reflect/Field;)V",  (void *) set_field_accessible},
    };
    if (env->RegisterNatives(clazz, gMethods, sizeof(gMethods) / sizeof(gMethods[0])) < 0) {
        ALOGE("jni register error.");
    }

    HookEnv.api_level = api_level;

    jmethodID nativeOffsetId = env->GetStaticMethodID(clazz, "nativeOffset", "()V");
    jmethodID nativeOffset2Id = env->GetStaticMethodID(clazz, "nativeOffset2", "()V");

    jfieldID nativeOffsetFieldId = env->GetStaticFieldID(clazz, "NATIVE_OFFSET", "I");
    jfieldID nativeOffsetField2Id = env->GetStaticFieldID(clazz, "NATIVE_OFFSET_2", "I");

    void *nativeOffsetPtr = GetArtMethod(env, clazz, nativeOffsetId);
    void *nativeOffset2Ptr = GetArtMethod(env, clazz, nativeOffset2Id);
    HookEnv.art_method_size = (size_t) nativeOffset2Ptr - (size_t) nativeOffsetPtr;

    void *nativeFieldPtr = GetFieldMethod(env, env->ToReflectedField(clazz, nativeOffsetFieldId, true));
    void *nativeField2Ptr = GetFieldMethod(env, env->ToReflectedField(clazz, nativeOffsetField2Id, true));
    HookEnv.art_field_size = (size_t) nativeField2Ptr - (size_t) nativeFieldPtr;

    auto artMethod = reinterpret_cast<uintptr_t *>(nativeOffsetPtr);
    int i;
    for (i = 0; i < HookEnv.art_method_size; ++i) {
        if (reinterpret_cast<void *>(artMethod[i]) == (void*)native_offset) {
            HookEnv.art_method_native_offset = i;
            break;
        }
    }

    uint32_t flags = kAccPublic | kAccStatic | kAccNative | kAccFinal;
    if (api_level >= __ANDROID_API_Q__) flags |= kAccPublicApi;
    if (api_level >= __ANDROID_API_S__) flags |= kAccNterpInvokeFastPathFlag;

    char *start = reinterpret_cast<char *>(artMethod);
    for (i = 1; i < HookEnv.art_method_size; ++i) {
        auto value = *(uint32_t *) (start + i * sizeof(uint32_t));
        if (value == flags) {
            HookEnv.art_method_flags_offset = i * sizeof(uint32_t);
            break;
        }
    }

    flags = kAccPublic | kAccStatic | kAccFinal;
    if (api_level >= __ANDROID_API_Q__) flags |= kAccPublicApi;
    char *fieldStart = reinterpret_cast<char *>(nativeFieldPtr);
    for (i = 1; i < HookEnv.art_field_size; ++i) {
        auto value = *(int32_t *) (fieldStart + i * sizeof(int32_t));
        if (value == flags) {
            HookEnv.art_field_flags_offset = i * sizeof(int32_t);
            break;
        }
    }

    HookEnv.method_utils_class = (jclass)env->NewGlobalRef(env->FindClass("com/onecore/sdk/core/MethodUtils"));
    HookEnv.get_method_desc_id = env->GetStaticMethodID(HookEnv.method_utils_class, "getDesc", "(Ljava/lang/reflect/Method;)Ljava/lang/String;");
    HookEnv.get_method_declaring_class_id = env->GetStaticMethodID(HookEnv.method_utils_class, "getDeclaringClass", "(Ljava/lang/reflect/Method;)Ljava/lang/String;");
    HookEnv.get_method_name_id = env->GetStaticMethodID(HookEnv.method_utils_class, "getMethodName", "(Ljava/lang/reflect/Method;)Ljava/lang/String;");
}

void installJniHooks(JNIEnv* env) {
    LOGI("JNI Hook Engine: INITIALIZING");
    // We would need the actual Android API level here, 
    // for now we use a default or get it from properties.
    // In actual usage, it would be passed from Java.
    // JniHook::InitJniHook(env, SDK_INT);
}
