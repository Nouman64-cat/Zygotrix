// json11.cpp - minimal JSON parser implementation (subset of the original json11)

#include "json11.hpp"

#include <cctype>
#include <cstdlib>
#include <iomanip>
#include <sstream>
#include <stdexcept>

namespace json11 {

namespace {

using std::string;
using std::vector;
using std::map;

struct Statics {
    const Json null_json;
    const Json false_json;
    const Json true_json;
    const string empty_string;
    const vector<Json> empty_vec;
    const map<string, Json> empty_map;

    Statics()
        : null_json(),
          false_json(false),
          true_json(true),
          empty_string(),
          empty_vec(),
          empty_map() {}
};

const Statics &statics() {
    static const Statics s;
    return s;
}

class JsonParser {
public:
    JsonParser(const string &in, string &err)
        : m_str(in), m_err(err), m_pos(0) {}

    Json parse() {
        skip_whitespace();
        Json result = parse_value();
        skip_whitespace();
        if (!m_err.empty()) {
            return Json();
        }
        if (m_pos != m_str.size()) {
            m_err = "Unexpected trailing characters";
            return Json();
        }
        return result;
    }

private:
    const string &m_str;
    string &m_err;
    size_t m_pos;

    void skip_whitespace() {
        while (m_pos < m_str.size() && std::isspace(static_cast<unsigned char>(m_str[m_pos]))) {
            m_pos++;
        }
    }

    char peek() const {
        if (m_pos >= m_str.size()) {
            return '\0';
        }
        return m_str[m_pos];
    }

    char get() {
        if (m_pos >= m_str.size()) {
            return '\0';
        }
        return m_str[m_pos++];
    }

    bool match(const string &text) {
        if (m_str.compare(m_pos, text.size(), text) == 0) {
            m_pos += text.size();
            return true;
        }
        return false;
    }

    Json parse_value() {
        char ch = peek();
        switch (ch) {
            case 'n':
                if (match("null")) {
                    return Json();
                }
                break;
            case 't':
                if (match("true")) {
                    return Json(true);
                }
                break;
            case 'f':
                if (match("false")) {
                    return Json(false);
                }
                break;
            case '"':
                return Json(parse_string());
            case '[':
                return Json(parse_array());
            case '{':
                return Json(parse_object());
            case '-':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                return Json(parse_number());
            default:
                break;
        }
        m_err = "Invalid value";
        return Json();
    }

    string parse_string() {
        if (get() != '"') {
            m_err = "Expected '\"' to begin string";
            return "";
        }
        string out;
        while (true) {
            if (m_pos >= m_str.size()) {
                m_err = "Unterminated string";
                return "";
            }
            char ch = get();
            if (ch == '"') {
                break;
            }
            if (ch == '\\') {
                if (m_pos >= m_str.size()) {
                    m_err = "Invalid escape sequence";
                    return "";
                }
                char esc = get();
                switch (esc) {
                    case '"':
                    case '\\':
                    case '/':
                        out.push_back(esc);
                        break;
                    case 'b':
                        out.push_back('\b');
                        break;
                    case 'f':
                        out.push_back('\f');
                        break;
                    case 'n':
                        out.push_back('\n');
                        break;
                    case 'r':
                        out.push_back('\r');
                        break;
                    case 't':
                        out.push_back('\t');
                        break;
                    case 'u': {
                        if (m_pos + 4 > m_str.size()) {
                            m_err = "Invalid unicode escape";
                            return "";
                        }
                        unsigned int code = 0;
                        for (int i = 0; i < 4; ++i) {
                            char hex = m_str[m_pos++];
                            code <<= 4;
                            if (hex >= '0' && hex <= '9') {
                                code |= static_cast<unsigned int>(hex - '0');
                            } else if (hex >= 'a' && hex <= 'f') {
                                code |= static_cast<unsigned int>(hex - 'a' + 10);
                            } else if (hex >= 'A' && hex <= 'F') {
                                code |= static_cast<unsigned int>(hex - 'A' + 10);
                            } else {
                                m_err = "Invalid unicode escape";
                                return "";
                            }
                        }
                        if (code <= 0x7F) {
                            out.push_back(static_cast<char>(code));
                        } else if (code <= 0x7FF) {
                            out.push_back(static_cast<char>(0xC0 | ((code >> 6) & 0x1F)));
                            out.push_back(static_cast<char>(0x80 | (code & 0x3F)));
                        } else {
                            out.push_back(static_cast<char>(0xE0 | ((code >> 12) & 0x0F)));
                            out.push_back(static_cast<char>(0x80 | ((code >> 6) & 0x3F)));
                            out.push_back(static_cast<char>(0x80 | (code & 0x3F)));
                        }
                        break;
                    }
                    default:
                        m_err = "Invalid escape sequence";
                        return "";
                }
            } else {
                out.push_back(ch);
            }
        }
        return out;
    }

    double parse_number() {
        size_t start = m_pos;
        if (peek() == '-') {
            m_pos++;
        }
        if (peek() == '0') {
            m_pos++;
        } else if (std::isdigit(static_cast<unsigned char>(peek()))) {
            while (std::isdigit(static_cast<unsigned char>(peek()))) {
                m_pos++;
            }
        } else {
            m_err = "Invalid number";
            return 0.0;
        }
        if (peek() == '.') {
            m_pos++;
            if (!std::isdigit(static_cast<unsigned char>(peek()))) {
                m_err = "Invalid number";
                return 0.0;
            }
            while (std::isdigit(static_cast<unsigned char>(peek()))) {
                m_pos++;
            }
        }
        if (peek() == 'e' || peek() == 'E') {
            m_pos++;
            if (peek() == '+' || peek() == '-') {
                m_pos++;
            }
            if (!std::isdigit(static_cast<unsigned char>(peek()))) {
                m_err = "Invalid number";
                return 0.0;
            }
            while (std::isdigit(static_cast<unsigned char>(peek()))) {
                m_pos++;
            }
        }
        double value = std::strtod(m_str.c_str() + start, nullptr);
        return value;
    }

    Json::JsonArray parse_array() {
        Json::JsonArray result;
        if (get() != '[') {
            m_err = "Expected '['";
            return result;
        }
        skip_whitespace();
        if (peek() == ']') {
            get();
            return result;
        }
        while (true) {
            skip_whitespace();
            result.push_back(parse_value());
            if (!m_err.empty()) {
                return Json::JsonArray();
            }
            skip_whitespace();
            char ch = get();
            if (ch == ']') {
                break;
            }
            if (ch != ',') {
                m_err = "Expected ',' or ']'";
                return Json::JsonArray();
            }
        }
        return result;
    }

    Json::JsonObject parse_object() {
        Json::JsonObject result;
        if (get() != '{') {
            m_err = "Expected '{'";
            return result;
        }
        skip_whitespace();
        if (peek() == '}') {
            get();
            return result;
        }
        while (true) {
            skip_whitespace();
            if (peek() != '"') {
                m_err = "Expected string key";
                return Json::JsonObject();
            }
            std::string key = parse_string();
            if (!m_err.empty()) {
                return Json::JsonObject();
            }
            skip_whitespace();
            if (get() != ':') {
                m_err = "Expected ':'";
                return Json::JsonObject();
            }
            skip_whitespace();
            Json value = parse_value();
            if (!m_err.empty()) {
                return Json::JsonObject();
            }
            result.emplace(std::move(key), std::move(value));
            skip_whitespace();
            char ch = get();
            if (ch == '}') {
                break;
            }
            if (ch != ',') {
                m_err = "Expected ',' or '}'";
                return Json::JsonObject();
            }
        }
        return result;
    }
};

}  // namespace

Json::Json() noexcept : m_type(NUL), number_(0.0), m_ptr(nullptr) {}
Json::Json(std::nullptr_t) noexcept : Json() {}
Json::Json(double value) : m_type(NUMBER), number_(value), m_ptr(nullptr) {}
Json::Json(int value) : Json(static_cast<double>(value)) {}
Json::Json(bool value) : m_type(BOOL), bool_(value), m_ptr(nullptr) {}
Json::Json(const std::string &value)
    : m_type(STRING), number_(0.0), m_ptr(std::make_shared<std::string>(value)) {}
Json::Json(std::string &&value)
    : m_type(STRING), number_(0.0), m_ptr(std::make_shared<std::string>(std::move(value))) {}
Json::Json(const char *value) : Json(std::string(value)) {}
Json::Json(const JsonArray &values)
    : m_type(ARRAY), number_(0.0), m_ptr(std::make_shared<JsonArray>(values)) {}
Json::Json(JsonArray &&values)
    : m_type(ARRAY), number_(0.0), m_ptr(std::make_shared<JsonArray>(std::move(values))) {}
Json::Json(const JsonObject &values)
    : m_type(OBJECT), number_(0.0), m_ptr(std::make_shared<JsonObject>(values)) {}
Json::Json(JsonObject &&values)
    : m_type(OBJECT), number_(0.0), m_ptr(std::make_shared<JsonObject>(std::move(values))) {}

Json::Json(const Json &other)
    : m_type(other.m_type), number_(other.number_), bool_(other.bool_), m_ptr(other.m_ptr) {}

Json::Json(Json &&other) noexcept
    : m_type(other.m_type), number_(other.number_), bool_(other.bool_), m_ptr(std::move(other.m_ptr)) {}

Json &Json::operator=(Json other) noexcept {
    std::swap(m_type, other.m_type);
    std::swap(number_, other.number_);
    std::swap(bool_, other.bool_);
    std::swap(m_ptr, other.m_ptr);
    return *this;
}

Json::JsonType Json::type() const { return m_type; }
bool Json::is_null() const { return m_type == NUL; }
bool Json::is_number() const { return m_type == NUMBER; }
bool Json::is_bool() const { return m_type == BOOL; }
bool Json::is_string() const { return m_type == STRING; }
bool Json::is_array() const { return m_type == ARRAY; }
bool Json::is_object() const { return m_type == OBJECT; }
double Json::number_value() const { return is_number() ? number_ : 0.0; }
bool Json::bool_value() const { return is_bool() ? bool_ : false; }

const std::string &Json::string_value() const {
    if (is_string()) {
        return *std::static_pointer_cast<std::string>(m_ptr);
    }
    return statics().empty_string;
}

const Json::JsonArray &Json::array_items() const {
    if (is_array()) {
        return *std::static_pointer_cast<JsonArray>(m_ptr);
    }
    return statics().empty_vec;
}

const Json::JsonObject &Json::object_items() const {
    if (is_object()) {
        return *std::static_pointer_cast<JsonObject>(m_ptr);
    }
    return statics().empty_map;
}

const Json &Json::operator[](size_t i) const {
    if (is_array()) {
        const auto &arr = *std::static_pointer_cast<JsonArray>(m_ptr);
        if (i < arr.size()) {
            return arr[i];
        }
    }
    return statics().null_json;
}

const Json &Json::operator[](const std::string &key) const {
    if (is_object()) {
        const auto &obj = *std::static_pointer_cast<JsonObject>(m_ptr);
        auto it = obj.find(key);
        if (it != obj.end()) {
            return it->second;
        }
    }
    return statics().null_json;
}

static void dump_internal(const Json &json, std::string &out, int indent, int depth) {
    switch (json.type()) {
        case Json::NUL:
            out += "null";
            break;
        case Json::NUMBER: {
            std::ostringstream oss;
            oss << std::setprecision(15) << json.number_value();
            out += oss.str();
        } break;
        case Json::BOOL:
            out += json.bool_value() ? "true" : "false";
            break;
        case Json::STRING: {
            out += '"';
            for (char ch : json.string_value()) {
                switch (ch) {
                    case '"':
                        out += "\\\"";
                        break;
                    case '\\':
                        out += "\\\\";
                        break;
                    case '\b':
                        out += "\\b";
                        break;
                    case '\f':
                        out += "\\f";
                        break;
                    case '\n':
                        out += "\\n";
                        break;
                    case '\r':
                        out += "\\r";
                        break;
                    case '\t':
                        out += "\\t";
                        break;
                    default:
                        out.push_back(ch);
                }
            }
            out += '"';
        } break;
        case Json::ARRAY: {
            const auto &arr = json.array_items();
            out += "[";
            bool first = true;
            for (const auto &item : arr) {
                if (!first) {
                    out += ",";
                }
                if (indent >= 0) {
                    out += "\n";
                    out.append((depth + 1) * indent, ' ');
                }
                dump_internal(item, out, indent, depth + 1);
                first = false;
            }
            if (indent >= 0 && !arr.empty()) {
                out += "\n";
                out.append(depth * indent, ' ');
            }
            out += "]";
        } break;
        case Json::OBJECT: {
            const auto &obj = json.object_items();
            out += "{";
            bool first = true;
            for (const auto &kv : obj) {
                if (!first) {
                    out += ",";
                }
                if (indent >= 0) {
                    out += "\n";
                    out.append((depth + 1) * indent, ' ');
                }
                dump_internal(Json(kv.first), out, indent, depth + 1);
                out += ":";
                if (indent >= 0) {
                    out += " ";
                }
                dump_internal(kv.second, out, indent, depth + 1);
                first = false;
            }
            if (indent >= 0 && !obj.empty()) {
                out += "\n";
                out.append(depth * indent, ' ');
            }
            out += "}";
        } break;
    }
}

std::string Json::dump(int indent) const {
    std::string out;
    dump_internal(*this, out, indent, 0);
    return out;
}

Json Json::parse(const std::string &in, std::string &err) {
    JsonParser parser(in, err);
    return parser.parse();
}

const Json &Json::static_null() const { return statics().null_json; }
const Json &Json::static_false() const { return statics().false_json; }
const std::string &Json::static_string() const { return statics().empty_string; }
const Json::JsonArray &Json::static_array() const { return statics().empty_vec; }
const Json::JsonObject &Json::static_object() const { return statics().empty_map; }

}  // namespace json11

