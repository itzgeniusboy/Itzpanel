#ifndef OBFUSCATE_H
#define OBFUSCATE_H

#include <cstddef>

namespace ay {
    template <size_t N, char KEY>
    class obfuscator {
    public:
        constexpr obfuscator(const char* data) {
            for (size_t i = 0; i < N; i++) {
                _data[i] = data[i] ^ KEY;
            }
        }

        char* get() {
            for (size_t i = 0; i < N; i++) {
                _data[i] = _data[i] ^ KEY;
            }
            _data[N] = '\0';
            return _data;
        }

    private:
        char _data[N + 1];
    };
}

#define OBFUSCATE(str) []() { \
    static ay::obfuscator<sizeof(str) - 1, 0x55> obj(str); \
    return obj.get(); \
}()

#endif
