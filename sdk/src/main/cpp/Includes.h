#ifndef ONECORE_INCLUDES_H
#define ONECORE_INCLUDES_H

#include <jni.h>
#include <errno.h>

#include <string.h>
#include <unistd.h>
#include <stdint.h>
#include <inttypes.h>
#include <iostream>
#include <fstream>
#include <stdio.h>
#include <sstream>
#include <vector>
#include <map>
#include <iomanip>
#include <thread>

#include <sys/types.h>
#include <sys/stat.h>
#include <sys/resource.h>
#include <sys/uio.h>

#include <fcntl.h>
#include <android/log.h>
#include <pthread.h>
#include <dirent.h>
#include <list>
#include <libgen.h>

#include <sys/mman.h>
#include <sys/wait.h>

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/un.h>

#include <codecvt>
#include <chrono>
#include <queue>

using namespace std::chrono_literals;

#include <EGL/egl.h>
#include <GLES3/gl3.h>

#include <sys/system_properties.h>

#include "Utils/Tools.h"
#include "oxorany/oxorany.h"
#include "esp/obfuscate.h"
#include "ElfImg.h"
#include "dobby.h"

#define HOOK(target, hook, original) OneCore::Tools::Hook((void *)(target), (void *)(hook), (void **)(original))
#define LOGI(...) ((void)__android_log_print(ANDROID_LOG_INFO, "OneCore", __VA_ARGS__))
#define LOGE(...) ((void)__android_log_print(ANDROID_LOG_ERROR, "OneCore", __VA_ARGS__))

#endif // ONECORE_INCLUDES_H
