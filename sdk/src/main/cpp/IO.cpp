#include "IO.h"
#include <android/log.h>
#include <string.h>

#define TAG "OneCore-IO"
#define ALOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)


static std::map<std::string, std::string> g_io_rules;

void IO::init(JNIEnv *env) {
    ALOGD("IO Engine Initialized");
}

void IO::addRule(const char* target, const char* relocate) {
    if (target && relocate) {
        g_io_rules[target] = relocate;
        ALOGD("Rule added: %s -> %s", target, relocate);
    }
}

std::string IO::redirectPath(const char* path) {
    if (!path) return "";
    std::string s_path(path);
    
    for (auto const& [target, relocate] : g_io_rules) {
        if (s_path.find(target) == 0) {
            std::string redirected = relocate + s_path.substr(target.length());
            return redirected;
        }
    }
    return s_path;
}
