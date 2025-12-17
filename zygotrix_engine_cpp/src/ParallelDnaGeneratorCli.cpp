#include "ParallelDnaGenerator.hpp"
#include "ThreadPool.hpp"
#include "../third_party/json11/json11.hpp"

#include <iostream>
#include <string>
#include <stdexcept>
#include <chrono>

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

        // Support large sequences - up to 100M bp
        long long length = static_cast<long long>(request["length"].number_value());
        double gc_content = request["gc_content"].number_value();

        if (length <= 0)
        {
            throw std::runtime_error("Length must be greater than 0");
        }
        if (length > 100000000) // 100M limit
        {
            throw std::runtime_error("Length must not exceed 100,000,000");
        }
        if (gc_content < 0.0 || gc_content > 1.0)
        {
            throw std::runtime_error("GC content must be between 0.0 and 1.0");
        }

        // Get optional thread count for the pool
        // Default to 2 threads for single-core servers (provides concurrency)
        unsigned int pool_threads = 2;
        if (has_field(request, "threads") && !request["threads"].is_null())
        {
            pool_threads = static_cast<unsigned int>(request["threads"].number_value());
        }

        // Check if we should use the thread pool (default: true for server environments)
        bool use_pool = true;
        if (has_field(request, "use_pool") && !request["use_pool"].is_null())
        {
            use_pool = request["use_pool"].bool_value();
        }

        // Create generator
        ParallelDnaGenerator generator(pool_threads);

        // Optional seed for reproducibility
        if (has_field(request, "seed") && !request["seed"].is_null())
        {
            unsigned int seed = static_cast<unsigned int>(request["seed"].number_value());
            generator.setSeed(seed);
        }

        // Time the generation
        auto start = std::chrono::high_resolution_clock::now();

        std::string sequence;

        if (use_pool) {
            // Use the global thread pool (recommended for servers)
            // This reuses threads instead of creating new ones per request
            ThreadPool& pool = ThreadPool::getInstance(pool_threads);
            sequence = generator.generateWithPool(static_cast<size_t>(length), gc_content, pool);
        } else {
            // Use std::async (legacy behavior - creates new threads per request)
            sequence = generator.generate(static_cast<size_t>(length), gc_content);
        }

        auto end = std::chrono::high_resolution_clock::now();
        auto duration_ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

        double actual_gc = calculate_actual_gc(sequence);

        Json response = Json(Json::JsonObject{
            {"sequence", Json(sequence)},
            {"length", Json(static_cast<int>(sequence.length()))},
            {"gc_content", Json(gc_content)},
            {"actual_gc", Json(actual_gc)},
            {"threads_used", Json(static_cast<int>(pool_threads))},
            {"generation_time_ms", Json(static_cast<int>(duration_ms))},
            {"used_thread_pool", Json(use_pool)}
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
