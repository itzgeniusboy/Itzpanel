cmake_minimum_required(VERSION 3.4.1)

project("onecore-native")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(JniHook)
include_directories(./)
include_directories(Utils)
include_directories(Hook)
include_directories(KittyMemory)
include_directories(And64InlineHook)
include_directories(oxorany)
include_directories(esp)

aux_source_directory(./ SRC1)
aux_source_directory(Utils SRC2)
aux_source_directory(Hook SRC3)
aux_source_directory(JniHook SRC4)
aux_source_directory(KittyMemory SRC5)
aux_source_directory(And64InlineHook SRC6)
aux_source_directory(oxorany SRC7)

add_compile_options(-w)

add_library(
        onecore_native
        SHARED
        ${SRC1}
        ${SRC2}
        ${SRC3}
        ${SRC4}
        ${SRC5}
        ${SRC6}
        ${SRC7}
        BoxCore.cpp
        IO.cpp
        BaseHook.cpp
        OneCoreCore.cpp
        ElfImg.cpp
        Utils/Tools.cpp
        dobby.c
)

find_library(log-lib log)
find_library(android-lib android)

target_link_libraries(
        onecore_native
        ${log-lib}
        ${android-lib}
        z
        dl
)
