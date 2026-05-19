#ifndef ONECORE_RUNTIME_HOOK_H
#define ONECORE_RUNTIME_HOOK_H

#include <jni.h>

namespace OneCore {
    class RuntimeHook {
    public:
        static void init(JNIEnv *env);
    };

    void installRuntimeHooks();
}

#endif // ONECORE_RUNTIME_HOOK_H
