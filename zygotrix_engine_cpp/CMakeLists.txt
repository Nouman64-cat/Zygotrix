cmake_minimum_required(VERSION 3.16)

project(zygotrix_engine_cpp VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(zygotrix_engine STATIC
    src/Engine.cpp
)

target_include_directories(zygotrix_engine
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
)

add_executable(zyg_demo examples/demo.cpp)
target_link_libraries(zyg_demo PRIVATE zygotrix_engine)

enable_testing()

