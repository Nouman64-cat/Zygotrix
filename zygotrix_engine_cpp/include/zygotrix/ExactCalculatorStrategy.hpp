#pragma once

#include "zygotrix/ICrossCalculator.hpp"

namespace zygotrix {
        class ExactCalculatorStrategy : public ICrossCalculator {
                public:
                        virtual json11::Json calculate(
                                const Engine& engine,
                                const Individual& mother,
                                const Individual& father,
                                const json11::Json& request
                        ) const override;
        };
}