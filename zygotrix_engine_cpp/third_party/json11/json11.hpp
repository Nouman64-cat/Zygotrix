// json11.hpp
// Copyright (c) 2013 Dropbox, Inc.
// MIT License

#pragma once

#include <map>
#include <memory>
#include <string>
#include <vector>

namespace json11 {

class Json final {
public:
    enum JsonType {
        NUL,
        NUMBER,
        BOOL,
        STRING,
        ARRAY,
        OBJECT
    };

    typedef std::vector<Json> JsonArray;
    typedef std::map<std::string, Json> JsonObject;

    Json() noexcept;                      // NUL
    Json(std::nullptr_t) noexcept;        // NUL
    Json(double value);                   // NUMBER
    Json(int value);                      // NUMBER
    Json(bool value);                     // BOOL
    Json(const std::string &value);       // STRING
    Json(std::string &&value);            // STRING
    Json(const char * value);             // STRING
    Json(const JsonArray &values);        // ARRAY
    Json(JsonArray &&values);             // ARRAY
    Json(const JsonObject &values);       // OBJECT
    Json(JsonObject &&values);            // OBJECT

    Json(const Json &other);
    Json(Json &&other) noexcept;
    Json &operator=(Json other) noexcept;

    JsonType type() const;

    bool is_null() const;
    bool is_number() const;
    bool is_bool() const;
    bool is_string() const;
    bool is_array() const;
    bool is_object() const;

    double number_value() const;
    bool bool_value() const;
    const std::string &string_value() const;
    const JsonArray &array_items() const;
    const JsonObject &object_items() const;

    const Json &operator[](size_t i) const;
    const Json &operator[](const std::string &key) const;

    std::string dump(int indent = -1) const;

    static Json parse(const std::string &in, std::string &err);

private:
    JsonType m_type;
    union {
        double number_;
        bool bool_;
    };
    std::shared_ptr<void> m_ptr;

    const Json &static_null() const;
    const Json &static_false() const;
    const std::string &static_string() const;
    const JsonArray &static_array() const;
    const JsonObject &static_object() const;
};

}  // namespace json11

