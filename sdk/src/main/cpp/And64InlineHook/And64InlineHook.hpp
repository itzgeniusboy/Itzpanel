#ifndef AND64INLINEHOOK_HPP
#define AND64INLINEHOOK_HPP

#include <stdint.h>

#if defined(__aarch64__)

#ifdef __cplusplus
extern "C" {
#endif

void A64HookFunction(void *symbol, void *replace, void **result);

#ifdef __cplusplus
}
#endif

#endif // defined(__aarch64__)

#endif // AND64INLINEHOOK_HPP
