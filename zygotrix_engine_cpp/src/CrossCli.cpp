#include "zygotrix/Engine.hpp"
#include "json11/json11.hpp"


#include "zygotrix/ICrossCalculator.hpp"
#include "zygotrix/ExactCalculatorStrategy.hpp"
#include "zygotrix/SimulationCalculatorStrategy.hpp"


#include "zygotrix/JsonRequestBuilder.hpp"

#include <iostream>
#include <string>
#include <sstream>
#include <stdexcept>
#include <memory> 

using json11::Json;
using namespace zygotrix;

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

} 

int main()
{
    std::string input = read_all_stdin();
    std::string error;
    Json request = Json::parse(input, error);
    if (!error.empty())
    {
        Json response = Json(Json::JsonObject{
            {"error", Json("Invalid JSON: " + error)}});
        std::cout << response.dump() << std::endl;
        return 1;
    }

    try
    {
        
        JsonRequestBuilder builder(request);
        EngineConfig config = builder.buildEngineConfig();
        Engine engine(config);
        Individual mother = builder.buildMother(engine);
        Individual father = builder.buildFather(engine);

        
        bool useExactMode = false;
        if (!has_field(request, "simulations"))
        {
            useExactMode = true;
        }
        if (has_field(request, "exact") && request["exact"].bool_value())
        {
            useExactMode = true;
        }
        if (has_field(request, "as_percentages"))
        {
            useExactMode = true; 
        }
        if (has_field(request, "joint_phenotypes") && request["joint_phenotypes"].bool_value())
        {
            useExactMode = true;
        }

        
        std::unique_ptr<zygotrix::ICrossCalculator> calculator;
        if (useExactMode)
        {
            calculator = std::make_unique<zygotrix::ExactCalculatorStrategy>();
        }
        else
        {
            calculator = std::make_unique<zygotrix::SimulationCalculatorStrategy>();
        }

        
        Json response = calculator->calculate(engine, mother, father, request);
        
        std::cout << response.dump() << std::endl;
        return 0;
    }
    catch (const std::exception &ex)
    {
        Json response = Json(Json::JsonObject{
            {"error", Json(ex.what())}});
        std::cout << response.dump() << std::endl;
        return 2;
    }
}