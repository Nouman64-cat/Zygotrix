#pragma once

#include "zygotrix/Engine.hpp"
#include "json11/json11.hpp"

#include <memory>

namespace zygotrix {
        class ICrossCalculator {
                public:
                        virtual ~ICrossCalculator() = default;

                        virtual json11::Json calculate(
                                const Engine& engine,
                                const Individual& mother,
                                const Individual& father,
                                const json11::Json& request
                        ) const = 0;
        };
}