#ifndef ONECORE_UNIX_FILESYSTEM_HOOK_H
#define ONECORE_UNIX_FILESYSTEM_HOOK_H

#include <jni.h>


class UnixFileSystemHook {
public:
    static void init(JNIEnv *env);
};


#endif // ONECORE_UNIX_FILESYSTEM_HOOK_H
