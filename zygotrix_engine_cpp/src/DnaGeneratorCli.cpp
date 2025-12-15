#include "DnaGenerator.hpp"
#include "json11/json11.hpp"

#include <iostream>
#include <string>
#include <sstream>
#include <stdexcept>
#include <algorithm>

using json11::Json;

namespace
{
    std::string read_all_stdin()
    {
        std::istreambuf_iterator<char> begin(std::cin);
        std::istreambuf_iterator<char> end;
        return std::string(begin, end);
    }

    bool has_field(const Json &obj, const std::string &field)
    {
        return obj.is_object() && obj.object_items().count(field) != 0;
    }

    double calculate_actual_gc(const std::string &sequence)
    {
        if (sequence.empty())
        {
            return 0.0;
        }

        size_t gc_count = 0;
        for (char base : sequence)
        {
            if (base == 'G' || base == 'C' || base == 'g' || base == 'c')
            {
                gc_count++;
            }
        }

        return static_cast<double>(gc_count) / sequence.length();
    }

}

int main()
{
    std::string input = read_all_stdin();
    std::string error;
    Json request = Json::parse(input, error);

    if (!error.empty())
    {
        Json response = Json(Json::JsonObject{
            {"error", Json("Invalid JSON: " + error)}
        });
        std::cout << response.dump() << std::endl;
        return 1;
    }

    try
    {
        if (!has_field(request, "length"))
        {
            throw std::runtime_error("Missing required field: length");
        }
        if (!has_field(request, "gc_content"))
        {
            throw std::runtime_error("Missing required field: gc_content");
        }

        int length = static_cast<int>(request["length"].number_value());
        double gc_content = request["gc_content"].number_value();

        if (length <= 0)
        {
            throw std::runtime_error("Length must be greater than 0");
        }
        if (length > 1000000)
        {
            throw std::runtime_error("Length must not exceed 1,000,000");
        }
        if (gc_content < 0.0 || gc_content > 1.0)
        {
            throw std::runtime_error("GC content must be between 0.0 and 1.0");
        }

        DnaGenerator generator;

        if (has_field(request, "seed") && !request["seed"].is_null())
        {
            unsigned int seed = static_cast<unsigned int>(request["seed"].number_value());
            generator.reseed(seed);
        }

        std::string sequence = generator.generate(static_cast<size_t>(length), gc_content);

        double actual_gc = calculate_actual_gc(sequence);

        Json response = Json(Json::JsonObject{
            {"sequence", Json(sequence)},
            {"length", Json(static_cast<int>(sequence.length()))},
            {"gc_content", Json(gc_content)},
            {"actual_gc", Json(actual_gc)}
        });

        std::cout << response.dump() << std::endl;
        return 0;
    }
    catch (const std::exception &ex)
    {
        Json response = Json(Json::JsonObject{
            {"error", Json(std::string(ex.what()))}
        });
        std::cout << response.dump() << std::endl;
        return 2;
    }
}
