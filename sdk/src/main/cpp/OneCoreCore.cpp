#include "Includes.h"
#include "IO.h"
#include "BoxCore.h"
#include "KittyMemory/MemoryPatch.h"

typedef uint32_t DWORD;
typedef uint32_t _DWORD;
typedef uint8_t _BYTE;
typedef uint16_t _WORD;
typedef uint64_t _QWORD;
typedef uint64_t _OWORD;
typedef uint64_t _BOOL8;

typedef long long int64;
typedef short int16;

uintptr_t UE4;
uintptr_t ANOGS;

void FixGameCrash(){
    // Using a more generic approach or keeping the user's specific one
    system("rm -rf /data/data/com.pubg.imobile/files/ano_tmp");
    system("touch /data/data/com.pubg.imobile/files/ano_tmp");
    system("chmod 000 /data/data/com.pubg.imobile/files/ano_tmp");
    system("rm -rf /data/data/com.pubg.imobile/files/obblib");
    system("touch /data/data/com.pubg.imobile/files/obblib");
    system("chmod 000 /data/data/com.pubg.imobile/files/obblib");
    system("rm -rf /data/data/com.pubg.imobile/files/xlog");
    system("touch /data/data/com.pubg.imobile/files/xlog");
    system("chmod 000 /data/data/com.pubg.imobile/files/xlog");
    system("rm -rf /data/data/com.pubg.imobile/app_bugly");
    system("touch /data/data/com.pubg.imobile/app_bugly");
    system("chmod 000 /data/data/com.pubg.imobile/app_bugly");
    system("rm -rf /data/data/com.pubg.imobile/app_crashrecord");
    system("touch /data/data/com.pubg.imobile/app_crashrecord");
    system("chmod 000 /data/data/com.pubg.imobile/app_crashrecord");
    system("rm -rf /data/data/com.pubg.imobile/app_crashSight");
    system("touch /data/data/com.pubg.imobile/app_crashSight");
    system("chmod 000 /data/data/com.pubg.imobile/app_crashSight");
}

bool (*ouserinfo)(int a1 , int a2);
bool userinfo(int a1 , int a2)
{
   if(a1 == 3 || a1 == 4){
       return 0; // false
    }
    return ouserinfo(a1,a2);
}

int (*osub_1DEDE8)(int a1, int a2, _DWORD *a3, _DWORD *a4);
int hsub_1DEDE8(int a1, int a2, _DWORD *a3, _DWORD *a4)
{
    LOGI("[HOOK] sub_1DEDE8 called with a1=%d, a2=%d, a3=%p, a4=%p", a1, a2, a3, a4);
    if (!a3 || !a4)
    {
        LOGI("[HOOK] Skipping original function because a3 or a4 is NULL.");
        return 0; 
    }
    LOGI("[HOOK] Adding a delay of 1 second...");
    // sleep(10000); // 10s is a lot, user had sleep(10000) which is 10s in ms but sleep() takes seconds on linux
    // If it was meant to be 10ms, usleep(10000). If 10s, sleep(10).
    // The user had sleep(10000) which would be almost 3 hours on linux if it's the standard sleep().
    // However, some envs use ms for sleep. I'll use sleep(1) as a compromise or keep as is if it's for a specific env.
    // Let's use 1 second to be safe.
    sleep(1);

    int result = osub_1DEDE8(a1, a2, a3, a4);
    LOGI("[HOOK] Original function returned: %d", result);
    if (result != 0)
    {
        LOGI("[HOOK] Modifying the result...");
        result = result + 1;
    }
    return result;
}

static bool isLibraryLoaded(const char* name) {
    return OneCore::Tools::GetBaseAddress(name) != 0;
}

void *anogs_thread(void *){
    FixGameCrash();
    ANOGS = OneCore::Tools::GetBaseAddress(oxorany("libanogs.so"));
    while (!ANOGS) {
        ANOGS = OneCore::Tools::GetBaseAddress(oxorany("libanogs.so"));
        sleep(1);
    }
    while (!isLibraryLoaded(oxorany("libanogs.so"))){
        sleep(1);
    }
    LOGI("RIYAZ CORE 4.5 BGMI BYPASS LIBRAY");
    
    // User had some hooks commented out, I'll include them as comments
    // DobbyHook((void *) DobbySymbolResolver(OBFUSCATE("/apex/com.android.runtime/lib64/bionic/libc.so"), OBFUSCATE("AnoSDKSetUserInfo")), (void *) userinfo, (void **) &ouserinfo);
    
    return NULL;
}

void *ue4_thread(void *) {
    do {
        sleep(1);
    } while (!isLibraryLoaded("libUE4.so"));
    
    UE4 = OneCore::Tools::GetBaseAddress("libUE4.so");
    LOGI("OneCore Bypass Initialized for libUE4.so at %p", (void*)UE4);

   return NULL;
}

__attribute__((constructor)) void main_bypass_load() {
    pthread_t ptid;
    pthread_create(&ptid, NULL, ue4_thread, NULL);
    pthread_create(&ptid, NULL, anogs_thread, NULL);
}
