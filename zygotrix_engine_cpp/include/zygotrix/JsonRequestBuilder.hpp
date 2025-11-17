#pragma once

#include "zygotrix/Engine.hpp"
#include "json11/json11.hpp"

namespace zygotrix {
        class JsonRequestBuilder {
                public:
                        explicit JsonRequestBuilder(const json11::Json& request);
                        EngineConfig buildEngineConfig() const;
                        Individual buildMother(const Engine& engine) const;
                        Individual buildFather(const Engine& engine) const;

                        private:
                                const json11::Json& m_request;
        };
}