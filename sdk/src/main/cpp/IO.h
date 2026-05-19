#ifndef ONECORE_IO_H
#define ONECORE_IO_H

#include <jni.h>
#include <string>
#include <map>
#include <vector>


class IO {
public:
    static void init(JNIEnv *env);
    static void addRule(const char* target, const char* relocate);
    static std::string redirectPath(const char* path);
};


#endif // ONECORE_IO_H
