#ifndef ONECORE_VMCLASSLOADER_HOOK_H
#define ONECORE_VMCLASSLOADER_HOOK_H

#include <jni.h>

namespace OneCore {
    class VMClassLoaderHook {
    public:
        static void init(JNIEnv *env);
        static void hideXposed();
    };
}

#endif // ONECORE_VMCLASSLOADER_HOOK_H
