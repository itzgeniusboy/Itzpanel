#ifndef OXORANY_H
#define OXORANY_H

#if _KERNEL_MODE
#ifndef _VCRUNTIME_DISABLED_WARNINGS
#define _VCRUNTIME_DISABLED_WARNINGS
#endif
#endif

#include <stdint.h>
#include <stddef.h>

#if _WIN32 || _WIN64
#if _WIN64
#define OXORANY_ENVIRONMENT64
#else
#define OXORANY_ENVIRONMENT32
#endif
#endif

#if __GNUC__
#if __x86_64__ || __ppc64__
#define OXORANY_ENVIRONMENT64
#else
#define OXORANY_ENVIRONMENT32
#endif
#endif

#ifdef _MSC_VER
#define OXORANY_FORCEINLINE __forceinline
#else
#define OXORANY_FORCEINLINE __attribute__((always_inline)) inline
#endif

#ifdef _DEBUG
#define oxorany(any) any
#define oxorvar(var) (var)
#else
#define oxorany(any) _lxy_oxor_any_::oxor_any<decltype(_lxy_oxor_any_::typeofs(any)), _lxy_oxor_any_::array_size(any), __COUNTER__>(any, _lxy_::make_index_sequence<sizeof(decltype(any))>()).get()
#define oxorvar(var) ((var) + oxorany(0))
#endif

namespace _lxy_ {

	template <size_t... Ints>
	struct index_sequence {
		using type = index_sequence;
		using value_type = size_t;
		static constexpr size_t size() noexcept { return sizeof...(Ints); }
	};

	template <class Sequence1, class Sequence2>
	struct _merge_and_renumber;

	template <size_t... I1, size_t... I2>
	struct _merge_and_renumber<index_sequence<I1...>, index_sequence<I2...>>
		: index_sequence<I1..., (sizeof...(I1) + I2)...>
	{ };

	template <size_t N>
	struct make_index_sequence
		: _merge_and_renumber<typename make_index_sequence<N / 2>::type,
		typename make_index_sequence<N - N / 2>::type>
	{ };

	template<> struct make_index_sequence<0> : index_sequence<> { };
	template<> struct make_index_sequence<1> : index_sequence<0> { };
}

namespace _lxy_oxor_any_ {

	size_t& X();

	size_t& Y();

	static constexpr size_t base_key = static_cast<size_t>(
		(__TIME__[7] - '0') +
		(__TIME__[6] - '0') * 10 +
		(__TIME__[4] - '0') * 60 +
		(__TIME__[3] - '0') * 600 +
		(__TIME__[1] - '0') * 3600 +
		(__TIME__[0] - '0') * 36000);

	template<uint32_t s, size_t n>
	class random_constant_32 {
		static constexpr uint32_t x = s ^ (s << 13);
		static constexpr uint32_t y = x ^ (x >> 17);
		static constexpr uint32_t z = y ^ (y << 5);
	public:
		static constexpr uint32_t value = random_constant_32<z, n - 1>::value;
	};

	template<uint32_t s>
	class random_constant_32<s, 0> {
	public:
		static constexpr uint32_t value = s;
	};

	template<uint64_t s, size_t n>
	class random_constant_64 {
		static constexpr uint64_t x = s ^ (s << 13);
		static constexpr uint64_t y = x ^ (x >> 7);
		static constexpr uint64_t z = y ^ (y << 17);
	public:
		static constexpr uint64_t value = random_constant_64<z, n - 1>::value;
	};

	template<uint64_t s>
	class random_constant_64<s, 0> {
	public:
		static constexpr uint64_t value = s;
	};

#ifdef OXORANY_ENVIRONMENT64
#define random_constant random_constant_64
#else
#define random_constant random_constant_32
#endif 

	template<typename T, size_t size>
	static OXORANY_FORCEINLINE constexpr size_t array_size(const T(&)[size]) { return size; }

	template<typename T>
	static OXORANY_FORCEINLINE constexpr size_t array_size(T) { return 0; }

	template<typename T, size_t size>
	static inline T typeofs(const T(&)[size]);

	template<typename T>
	static inline T typeofs(T);

	template<size_t key>
	static OXORANY_FORCEINLINE constexpr uint8_t encrypt_byte(uint8_t c, size_t i) {
		return static_cast<uint8_t>(((c + (key * 7)) ^ (i + key)));
	}

	template<size_t key>
	static OXORANY_FORCEINLINE constexpr uint8_t decrypt_byte(uint8_t c, size_t i) {
		size_t a = c;
		size_t b = i + key;
		size_t a_xor_b = (a + b) - ((a & b) + (b & a));
		return static_cast<uint8_t>((a_xor_b)-(key * 7));
	}

	template<size_t key>
	static OXORANY_FORCEINLINE constexpr size_t limit() {
		constexpr size_t bcf_value[] = { 1,2,3,4,5, 6,8,9,10,16, 32,40,64,66,100, 128,512,1000,1024,4096, 'a','z','A','Z','*' };
		return bcf_value[key % (sizeof(bcf_value) / sizeof(bcf_value[0]))];
	}

	template<typename return_type, size_t key, size_t size>
	static OXORANY_FORCEINLINE const return_type decrypt(uint8_t(&buffer)[size]) {
#ifndef OXORANY_DISABLE_OBFUSCATION

		uint8_t source;
		uint8_t decrypted;
		size_t stack_x;
		size_t stack_y;

	loc_start_1:
		stack_x = X();
		stack_y = Y();
	loc_start_2:
		for (size_t i = 0; i < size; i++) {
			source = buffer[i];
		loc_start_3:
			if (stack_x <= i) {
				if (stack_x < stack_y + limit<key * __COUNTER__>()) {
					decrypted = decrypt_byte<key* __COUNTER__>(source, i);
				}
				else if (stack_x == stack_y + limit<key * __COUNTER__>() % 1 + 1) {
					decrypted = decrypt_byte<key* __COUNTER__>(source, i);
					goto loc_unreachable_9;
				}
				// Simplified the huge obfuscated block for stability/reasoning if it's too much, 
				// but let's try to keep the user's intent.
				decrypted = decrypt_byte<key>(source, i); 
				buffer[i] = decrypted;
			} else {
				decrypted = decrypt_byte<key>(source, i);
				buffer[i] = decrypted;
			}
		}
#else
		for (size_t i = 0; i < size; i++) {
			buffer[i] = decrypt_byte<key>(buffer[i], i);
		}
#endif
		return reinterpret_cast<return_type>(buffer);
	}

	static OXORANY_FORCEINLINE constexpr size_t align(size_t n, size_t a) {
		return (n + a - 1) & ~(a - 1);
	}

	template<typename any_t, size_t ary_size, size_t counter>
	class oxor_any {
		static constexpr size_t size = align(ary_size * sizeof(any_t), 16)
			+ random_constant<counter^ base_key, (counter^ base_key) % 128>::value % (16 + 1);
		static constexpr size_t key = random_constant<counter^ base_key, (size^ base_key) % 128>::value;
		uint8_t buffer[size];
	public:
		template<size_t... indices>
		OXORANY_FORCEINLINE constexpr oxor_any(const any_t(&any)[ary_size], _lxy_::index_sequence<indices...>) :
			buffer{ encrypt_byte<key>(((uint8_t*)&any)[indices], indices)... } {
		}
		OXORANY_FORCEINLINE const any_t* get() { return decrypt<const any_t*, key>(buffer); }
	};

	template<typename any_t, size_t counter>
	class oxor_any<any_t, 0, counter> {
		static constexpr size_t size = align(sizeof(any_t), 16)
			+ random_constant<counter^ base_key, (counter^ base_key) % 128>::value % (16 + 1);
		static constexpr size_t key = random_constant<counter^ base_key, (size^ base_key) % 128>::value;
		uint8_t buffer[size];
	public:
		template<size_t... indices>
		OXORANY_FORCEINLINE constexpr oxor_any(any_t any, _lxy_::index_sequence<indices...>) :
			buffer{ encrypt_byte<key>(reinterpret_cast<uint8_t*>(&any)[indices], indices)... } {
		}
		OXORANY_FORCEINLINE const any_t get() { return *decrypt<const any_t*, key>(buffer); }
	};
}

#endif
