/*
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
#define  __STDC_FORMAT_MACROS

#include <inttypes.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <android/log.h>
#include <cstring>
#include <errno.h>

#if defined(__aarch64__)

#include "And64InlineHook.hpp"

#define   A64_MAX_INSTRUCTIONS 5
#define   A64_MAX_REFERENCES   (A64_MAX_INSTRUCTIONS * 2)
#define   A64_NOP              0xd503201fu
#define   A64_JNIEXPORT        __attribute__((visibility("hidden")))
#define   A64_LOGE(...)        ((void)__android_log_print(ANDROID_LOG_ERROR, "A64_HOOK", __VA_ARGS__))
#ifndef NDEBUG
# define  A64_LOGI(...)        ((void)__android_log_print(ANDROID_LOG_INFO, "A64_HOOK", __VA_ARGS__))
#else
# define  A64_LOGI(...)        ((void)0)
#endif // NDEBUG

typedef uint32_t *__restrict *__restrict instruction;

typedef struct {
    struct fix_info {
        uint32_t *bp;
        uint32_t ls; // left-shift counts
        uint32_t ad; // & operand
    };
    struct insns_info {
        union {
            uint64_t insu;
            int64_t ins;
            void *insp;
        };
        fix_info fmap[A64_MAX_REFERENCES];
    };
    int64_t basep;
    int64_t endp;
    insns_info dat[A64_MAX_INSTRUCTIONS];

public:
    inline bool is_in_fixing_range(const int64_t absolute_addr) {
        return absolute_addr >= this->basep && absolute_addr < this->endp;
    }

    inline intptr_t get_ref_ins_index(const int64_t absolute_addr) {
        return static_cast<intptr_t>((absolute_addr - this->basep) / sizeof(uint32_t));
    }

    inline intptr_t get_and_set_current_index(uint32_t *__restrict inp, uint32_t *__restrict outp) {
        intptr_t current_idx = this->get_ref_ins_index(reinterpret_cast<int64_t>(inp));
        this->dat[current_idx].insp = outp;
        return current_idx;
    }

    inline void reset_current_ins(const intptr_t idx, uint32_t *__restrict outp) {
        this->dat[idx].insp = outp;
    }

    void
    insert_fix_map(const intptr_t idx, uint32_t *bp, uint32_t ls = 0u, uint32_t ad = 0xffffffffu) {
        for (auto &f : this->dat[idx].fmap) {
            if (f.bp == NULL) {
                f.bp = bp;
                f.ls = ls;
                f.ad = ad;
                return;
            } //if
        }
    }

    void process_fix_map(const intptr_t idx) {
        for (auto &f : this->dat[idx].fmap) {
            if (f.bp == NULL) break;
            *(f.bp) = *(f.bp) |
                      (((int32_t(this->dat[idx].ins - reinterpret_cast<int64_t>(f.bp)) >> 2)
                              << f.ls) & f.ad);
            f.bp = NULL;
        }
    }
} context;

static bool __fix_branch_imm(instruction inpp, instruction outpp, context *ctxp) {
    static constexpr uint32_t mbits = 6u;
    static constexpr uint32_t mask = 0xfc000000u;
    static constexpr uint32_t rmask = 0x03ffffffu;
    static constexpr uint32_t op_b = 0x14000000u;
    static constexpr uint32_t op_bl = 0x94000000u;

    const uint32_t ins = *(*inpp);
    const uint32_t opc = ins & mask;
    switch (opc) {
        case op_b:
        case op_bl: {
            intptr_t current_idx = ctxp->get_and_set_current_index(*inpp, *outpp);
            int64_t absolute_addr = reinterpret_cast<int64_t>(*inpp) +
                                    (static_cast<int32_t>(ins << mbits)
                                            >> (mbits - 2u));
            int64_t new_pc_offset =
                    static_cast<int64_t>(absolute_addr - reinterpret_cast<int64_t>(*outpp))
                            >> 2;
            bool special_fix_type = ctxp->is_in_fixing_range(absolute_addr);
            if (!special_fix_type && llabs(new_pc_offset) >= (rmask >> 1)) {
                bool b_aligned = (reinterpret_cast<uint64_t>(*outpp + 2) & 7u) == 0u;
                if (opc == op_b) {
                    if (b_aligned != true) {
                        (*outpp)[0] = A64_NOP;
                        ctxp->reset_current_ins(current_idx, ++(*outpp));
                    }
                    (*outpp)[0] = 0x58000051u; // LDR X17, #0x8
                    (*outpp)[1] = 0xd61f0220u; // BR X17
                    memcpy(*outpp + 2, &absolute_addr, sizeof(absolute_addr));
                    *outpp += 4;
                } else {
                    if (b_aligned == true) {
                        (*outpp)[0] = A64_NOP;
                        ctxp->reset_current_ins(current_idx, ++(*outpp));
                    }
                    (*outpp)[0] = 0x58000071u; // LDR X17, #12
                    (*outpp)[1] = 0x1000009eu; // ADR X30, #16
                    (*outpp)[2] = 0xd61f0220u; // BR X17
                    memcpy(*outpp + 3, &absolute_addr, sizeof(absolute_addr));
                    *outpp += 5;
                }
            } else {
                if (special_fix_type) {
                    intptr_t ref_idx = ctxp->get_ref_ins_index(absolute_addr);
                    if (ref_idx <= current_idx) {
                        new_pc_offset = static_cast<int64_t>(ctxp->dat[ref_idx].ins -
                                                             reinterpret_cast<int64_t>(*outpp))
                                >> 2;
                    } else {
                        ctxp->insert_fix_map(ref_idx, *outpp, 0u, rmask);
                        new_pc_offset = 0;
                    }
                }

                (*outpp)[0] = opc | (new_pc_offset & ~mask);
                ++(*outpp);
            }

            ++(*inpp);
            return ctxp->process_fix_map(current_idx), true;
        }
    }
    return false;
}

static bool __fix_cond_comp_test_branch(instruction inpp, instruction outpp, context *ctxp) {
    static constexpr uint32_t lsb = 5u;
    static constexpr uint32_t lmask01 = 0xff00001fu;
    static constexpr uint32_t mask0 = 0xff000010u;
    static constexpr uint32_t op_bc = 0x54000000u;
    static constexpr uint32_t mask1 = 0x7f000000u;
    static constexpr uint32_t op_cbz = 0x34000000u;
    static constexpr uint32_t op_cbnz = 0x35000000u;
    static constexpr uint32_t lmask2 = 0xfff8001fu;
    static constexpr uint32_t mask2 = 0x7f000000u;
    static constexpr uint32_t op_tbz = 0x36000000u;
    static constexpr uint32_t op_tbnz = 0x37000000u;

    const uint32_t ins = *(*inpp);
    uint32_t lmask = lmask01;
    if ((ins & mask0) != op_bc) {
        uint32_t opc = ins & mask1;
        if (opc != op_cbz && opc != op_cbnz) {
            opc = ins & mask2;
            if (opc != op_tbz && opc != op_tbnz) {
                return false;
            }
            lmask = lmask2;
        }
    }

    intptr_t current_idx = ctxp->get_and_set_current_index(*inpp, *outpp);
    int64_t absolute_addr = reinterpret_cast<int64_t>(*inpp) + ((ins & ~lmask) >> (lsb - 2u));
    int64_t new_pc_offset =
            static_cast<int64_t>(absolute_addr - reinterpret_cast<int64_t>(*outpp)) >> 2;
    bool special_fix_type = ctxp->is_in_fixing_range(absolute_addr);
    if (!special_fix_type && llabs(new_pc_offset) >= (~lmask >> (lsb + 1))) {
        if ((reinterpret_cast<uint64_t>(*outpp + 4) & 7u) != 0u) {
            (*outpp)[0] = A64_NOP;
            ctxp->reset_current_ins(current_idx, ++(*outpp));
        }
        (*outpp)[0] = (((8u >> 2u) << lsb) & ~lmask) | (ins & lmask); // B.C #0x8
        (*outpp)[1] = 0x14000005u; // B #0x14
        (*outpp)[2] = 0x58000051u; // LDR X17, #0x8
        (*outpp)[3] = 0xd61f0220u; // BR X17
        memcpy(*outpp + 4, &absolute_addr, sizeof(absolute_addr));
        *outpp += 6;
    } else {
        if (special_fix_type) {
            intptr_t ref_idx = ctxp->get_ref_ins_index(absolute_addr);
            if (ref_idx <= current_idx) {
                new_pc_offset = static_cast<int64_t>(ctxp->dat[ref_idx].ins -
                                                     reinterpret_cast<int64_t>(*outpp)) >> 2;
            } else {
                ctxp->insert_fix_map(ref_idx, *outpp, lsb, ~lmask);
                new_pc_offset = 0;
            }
        }

        (*outpp)[0] = (static_cast<uint32_t>(new_pc_offset << lsb) & ~lmask) | (ins & lmask);
        ++(*outpp);
    }

    ++(*inpp);
    return ctxp->process_fix_map(current_idx), true;
}

static bool __fix_loadlit(instruction inpp, instruction outpp, context *ctxp) {
    const uint32_t ins = *(*inpp);

    if ((ins & 0xff000000u) == 0xd8000000u) {
        ctxp->process_fix_map(ctxp->get_and_set_current_index(*inpp, *outpp));
        ++(*inpp);
        return true;
    }

    static constexpr uint32_t msb = 8u;
    static constexpr uint32_t lsb = 5u;
    static constexpr uint32_t mask_30 = 0x40000000u;
    static constexpr uint32_t mask_31 = 0x80000000u;
    static constexpr uint32_t lmask = 0xff00001fu;
    static constexpr uint32_t mask_ldr = 0xbf000000u;
    static constexpr uint32_t op_ldr = 0x18000000u;
    static constexpr uint32_t mask_ldrv = 0x3f000000u;
    static constexpr uint32_t op_ldrv = 0x1c000000u;
    static constexpr uint32_t mask_ldrsw = 0xff000000u;
    static constexpr uint32_t op_ldrsw = 0x98000000u;

    uint32_t mask = mask_ldr;
    uintptr_t faligned = (ins & mask_30) ? 7u : 3u;
    if ((ins & mask_ldr) != op_ldr) {
        mask = mask_ldrv;
        if (faligned != 7u)
            faligned = (ins & mask_31) ? 15u : 3u;
        if ((ins & mask_ldrv) != op_ldrv) {
            if ((ins & mask_ldrsw) != op_ldrsw) {
                return false;
            }
            mask = mask_ldrsw;
            faligned = 7u;
        }
    }

    intptr_t current_idx = ctxp->get_and_set_current_index(*inpp, *outpp);
    int64_t absolute_addr = reinterpret_cast<int64_t>(*inpp) +
                            ((static_cast<int32_t>(ins << msb) >> (msb + lsb - 2u)) & ~3u);
    int64_t new_pc_offset =
            static_cast<int64_t>(absolute_addr - reinterpret_cast<int64_t>(*outpp)) >> 2;
    bool special_fix_type = ctxp->is_in_fixing_range(absolute_addr);
    if (special_fix_type || (llabs(new_pc_offset) + (faligned + 1u - 4u) / 4u) >=
                            (~lmask >> (lsb + 1))) {
        while ((reinterpret_cast<uint64_t>(*outpp + 2) & faligned) != 0u) {
            *(*outpp)++ = A64_NOP;
        }
        ctxp->reset_current_ins(current_idx, *outpp);

        uint32_t ns = static_cast<uint32_t>((faligned + 1) / sizeof(uint32_t));
        (*outpp)[0] = (((8u >> 2u) << lsb) & ~mask) | (ins & lmask); // LDR #0x8
        (*outpp)[1] = 0x14000001u + ns; // B #0xc
        memcpy(*outpp + 2, reinterpret_cast<void *>(absolute_addr), faligned + 1);
        *outpp += 2 + ns;
    } else {
        faligned >>= 2;
        while ((new_pc_offset & faligned) != 0) {
            *(*outpp)++ = A64_NOP;
            new_pc_offset =
                    static_cast<int64_t>(absolute_addr - reinterpret_cast<int64_t>(*outpp)) >> 2;
        }
        ctxp->reset_current_ins(current_idx, *outpp);

        (*outpp)[0] = (static_cast<uint32_t>(new_pc_offset << lsb) & ~mask) | (ins & lmask);
        ++(*outpp);
    }

    ++(*inpp);
    return ctxp->process_fix_map(current_idx), true;
}

static bool __fix_pcreladdr(instruction inpp, instruction outpp, context *ctxp) {
    static constexpr uint32_t msb = 8u;
    static constexpr uint32_t lsb = 5u;
    static constexpr uint32_t mask = 0x9f000000u;
    static constexpr uint32_t rmask = 0x0000001fu;
    static constexpr uint32_t lmask = 0xff00001fu;
    static constexpr uint32_t fmask = 0x00ffffffu;
    static constexpr uint32_t max_val = 0x001fffffu;
    static constexpr uint32_t op_adr = 0x10000000u;
    static constexpr uint32_t op_adrp = 0x90000000u;

    const uint32_t ins = *(*inpp);
    intptr_t current_idx;
    switch (ins & mask) {
        case op_adr: {
            current_idx = ctxp->get_and_set_current_index(*inpp, *outpp);
            int64_t lsb_bytes = static_cast<uint32_t>(ins << 1u) >> 30u;
            int64_t absolute_addr = reinterpret_cast<int64_t>(*inpp) +
                                    (((static_cast<int32_t>(ins << msb) >> (msb + lsb - 2u)) &
                                      ~3u) | lsb_bytes);
            int64_t new_pc_offset = static_cast<int64_t>(absolute_addr -
                                                         reinterpret_cast<int64_t>(*outpp));
            bool special_fix_type = ctxp->is_in_fixing_range(absolute_addr);
            if (!special_fix_type && llabs(new_pc_offset) >= (max_val >> 1)) {
                if ((reinterpret_cast<uint64_t>(*outpp + 2) & 7u) != 0u) {
                    (*outpp)[0] = A64_NOP;
                    ctxp->reset_current_ins(current_idx, ++(*outpp));
                }

                (*outpp)[0] =
                        0x58000000u | (((8u >> 2u) << lsb) & ~mask) | (ins & rmask); // LDR #0x8
                (*outpp)[1] = 0x14000003u; // B #0xc
                memcpy(*outpp + 2, &absolute_addr, sizeof(absolute_addr));
                *outpp += 4;
            } else {
                if (special_fix_type) {
                    intptr_t ref_idx = ctxp->get_ref_ins_index(absolute_addr & ~3ull);
                    if (ref_idx <= current_idx) {
                        new_pc_offset = static_cast<int64_t>(ctxp->dat[ref_idx].ins -
                                                             reinterpret_cast<int64_t>(*outpp));
                    } else {
                        ctxp->insert_fix_map(ref_idx, *outpp, lsb, fmask);
                        new_pc_offset = 0;
                    }
                }

                (*outpp)[0] = (static_cast<uint32_t>(new_pc_offset << (lsb - 2u)) & fmask) |
                              (ins & lmask);
                ++(*outpp);
            }
        }
            break;
        case op_adrp: {
            current_idx = ctxp->get_and_set_current_index(*inpp, *outpp);
            int32_t lsb_bytes = static_cast<uint32_t>(ins << 1u) >> 30u;
            int64_t absolute_addr = (reinterpret_cast<int64_t>(*inpp) & ~0xfffll) +
                                    ((((static_cast<int32_t>(ins << msb) >> (msb + lsb - 2u)) &
                                       ~3u) | lsb_bytes) << 12);
            if (ctxp->is_in_fixing_range(absolute_addr)) {
                *(*outpp)++ = ins;
            } else {
                if ((reinterpret_cast<uint64_t>(*outpp + 2) & 7u) != 0u) {
                    (*outpp)[0] = A64_NOP;
                    ctxp->reset_current_ins(current_idx, ++(*outpp));
                }

                (*outpp)[0] =
                        0x58000000u | (((8u >> 2u) << lsb) & ~mask) | (ins & rmask); // LDR #0x8
                (*outpp)[1] = 0x14000003u; // B #0xc
                memcpy(*outpp + 2, &absolute_addr, sizeof(absolute_addr));
                *outpp += 4;
            }
        }
            break;
        default:
            return false;
    }

    ctxp->process_fix_map(current_idx);
    ++(*inpp);
    return true;
}

#define __flush_cache(c, n)        __builtin___clear_cache(reinterpret_cast<char *>(c), reinterpret_cast<char *>(c) + n)

static void __fix_instructions(uint32_t *__restrict inp, int32_t count, uint32_t *__restrict outp) {
    context ctx;
    ctx.basep = reinterpret_cast<int64_t>(inp);
    ctx.endp = reinterpret_cast<int64_t>(inp + count);
    memset(ctx.dat, 0, sizeof(ctx.dat));

    for (int i = 0; i < count; ++i) {
        ctx.dat[i].insu = inp[i];
    }

    uint32_t *__restrict cur_inp = inp;
    uint32_t *__restrict cur_outp = outp;

    while (cur_inp < (inp + count)) {
        if (__fix_branch_imm(&cur_inp, &cur_outp, &ctx)) continue;
        if (__fix_cond_comp_test_branch(&cur_inp, &cur_outp, &ctx)) continue;
        if (__fix_loadlit(&cur_inp, &cur_outp, &ctx)) continue;
        if (__fix_pcreladdr(&cur_inp, &cur_outp, &ctx)) continue;

        // Default: copy instruction unchanged
        ctx.process_fix_map(ctx.get_and_set_current_index(cur_inp, cur_outp));
        *cur_outp++ = *cur_inp++;
    }

    // Final jump back to original code
    cur_outp[0] = 0x58000051u; // LDR X17, #0x8
    cur_outp[1] = 0xd61f0220u; // BR X17
    uint64_t back_addr = reinterpret_cast<uint64_t>(inp + count);
    memcpy(cur_outp + 2, &back_addr, sizeof(back_addr));
}

extern "C" void A64HookFunction(void *symbol, void *replace, void **result) {
    if (symbol == NULL || replace == NULL) return;

    static size_t pagesize = sysconf(_SC_PAGESIZE);
    uintptr_t addr = reinterpret_cast<uintptr_t>(symbol);
    uintptr_t start = addr & ~(pagesize - 1);

    mprotect(reinterpret_cast<void *>(start), pagesize * 2, PROT_READ | PROT_WRITE | PROT_EXEC);

    if (result != NULL) {
        void *trampoline = mmap(NULL, pagesize, PROT_READ | PROT_WRITE | PROT_EXEC,
                                MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);
        __fix_instructions(reinterpret_cast<uint32_t *>(symbol), A64_MAX_INSTRUCTIONS,
                          reinterpret_cast<uint32_t *>(trampoline));
        __flush_cache(trampoline, pagesize);
        *result = trampoline;
    }

    uint32_t *target = reinterpret_cast<uint32_t *>(symbol);
    target[0] = 0x58000051u; // LDR X17, #0x8
    target[1] = 0xd61f0220u; // BR X17
    uint64_t replace_addr = reinterpret_cast<uint64_t>(replace);
    memcpy(target + 2, &replace_addr, sizeof(replace_addr));

    __flush_cache(symbol, A64_MAX_INSTRUCTIONS * sizeof(uint32_t));
    mprotect(reinterpret_cast<void *>(start), pagesize * 2, PROT_READ | PROT_EXEC);
}

#endif
