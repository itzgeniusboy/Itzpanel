#ifndef ONECORE_DEXFILE_HOOK_H
#define ONECORE_DEXFILE_HOOK_H

#include <jni.h>

namespace OneCore {
    class DexFileHook {
    public:
        static void init(JNIEnv *env);
        static void setFileReadonly(const char* filePath);
    };

    void installDexHooks();
}

#endif // ONECORE_DEXFILE_HOOK_H
