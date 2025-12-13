/**
 * Simulation Command Parser and Executor
 *
 * This service parses natural language commands from the chatbot
 * and executes them using the SimulationToolContext.
 */

export interface SimulationCommand {
  type:
    | "add_trait"
    | "add_all_traits"
    | "remove_trait"
    | "set_allele"
    | "randomize_alleles"
    | "set_count"
    | "run";
  params: any;
}

export interface ParsedCommands {
  commands: SimulationCommand[];
  summary: string;
}

/**
 * Parse a chatbot response to extract simulation commands
 */
export function parseSimulationCommands(response: string): ParsedCommands {
  const commands: SimulationCommand[] = [];
  let summary = "";

  // Look for command blocks in the response (format: [COMMAND:type:params])
  const commandRegex = /\[COMMAND:(\w+):([^\]]+)\]/g;
  let match;

  while ((match = commandRegex.exec(response)) !== null) {
    const [, type, paramsStr] = match;

    try {
      const params = JSON.parse(paramsStr);
      commands.push({ type: type as any, params });
    } catch (error) {
      console.error("Failed to parse command params:", error);
    }
  }

  // Extract summary (everything that's not a command)
  summary = response.replace(commandRegex, "").trim();

  return { commands, summary };
}

export interface ActionResult {
  description: string;
  status: "completed" | "failed";
}

/**
 * Execute simulation commands using the tool context
 */
export async function executeSimulationCommands(
  commands: SimulationCommand[],
  toolContext: any
): Promise<{ success: boolean; results: any[]; actions: ActionResult[] }> {
  const results = [];
  const actions: ActionResult[] = [];

  for (const command of commands) {
    let description = "";

    // Generate description for UI
    switch (command.type) {
      case "add_trait":
        description = `Add trait: ${command.params.traitKey}`;
        break;
      case "add_all_traits":
        description = "Add all available traits";
        break;
      case "remove_trait":
        description = `Remove trait: ${command.params.traitKey}`;
        break;
      case "set_allele":
        description = `Set ${command.params.parent} alleles for ${command.params.geneId}`;
        break;
      case "randomize_alleles":
        description = `Randomize alleles for ${
          command.params.parent || "both"
        } parent(s)`;
        break;
      case "set_count":
        description = `Set simulation count to ${command.params.count}`;
        break;
      case "run":
        description = "Run simulation";
        break;
      default:
        description = `Unknown command: ${command.type}`;
    }

    try {
      let result;

      switch (command.type) {
        case "add_trait":
          result = await toolContext.addTrait(command.params.traitKey);
          break;

        case "add_all_traits":
          result = await toolContext.addAllTraits();
          break;

        case "remove_trait":
          result = await toolContext.removeTrait(command.params.traitKey);
          break;

        case "set_allele":
          if (command.params.parent === "mother") {
            result = await toolContext.setMotherGenotype(
              command.params.geneId,
              command.params.alleles
            );
          } else {
            result = await toolContext.setFatherGenotype(
              command.params.geneId,
              command.params.alleles
            );
          }
          break;

        case "randomize_alleles":
          result = await toolContext.randomizeAlleles(
            command.params.parent || "both"
          );
          break;

        case "set_count":
          result = await toolContext.setSimulationCount(command.params.count);
          break;

        case "run":
          result = await toolContext.runSimulation();
          break;

        default:
          result = {
            success: false,
            message: `Unknown command type: ${command.type}`,
          };
      }

      results.push(result);
      actions.push({
        description,
        status: result.success ? "completed" : "failed",
      });
    } catch (error) {
      results.push({
        success: false,
        message: `Error executing command: ${error}`,
      });
      actions.push({
        description,
        status: "failed",
      });
    }
  }

  const success = results.every((r) => r.success);
  return { success, results, actions };
}

/**
 * Format simulation state for the chatbot context
 */
export function formatSimulationContext(state: any): string {
  const {
    activeTraits,
    motherGenotype,
    fatherGenotype,
    simulationCount,
    results,
  } = state;

  let context = "**Current Simulation State:**\n\n";

  // Active traits
  if (activeTraits.length > 0) {
    context += `**Active Traits:** ${activeTraits
      .map((t: any) => t.name)
      .join(", ")}\n\n`;
  } else {
    context += "**Active Traits:** None\n\n";
  }

  // Parent genotypes
  context += "**Mother Genotype:**\n";
  if (Object.keys(motherGenotype).length > 0) {
    for (const [geneId, alleles] of Object.entries(motherGenotype)) {
      context += `- ${geneId}: ${(alleles as string[]).join("/")}\n`;
    }
  } else {
    context += "- Not set\n";
  }

  context += "\n**Father Genotype:**\n";
  if (Object.keys(fatherGenotype).length > 0) {
    for (const [geneId, alleles] of Object.entries(fatherGenotype)) {
      context += `- ${geneId}: ${(alleles as string[]).join("/")}\n`;
    }
  } else {
    context += "- Not set\n";
  }

  context += `\n**Simulation Count:** ${simulationCount}\n`;

  // Results
  if (results) {
    context += "\n**Last Results:**\n";
    if (results.sex_counts) {
      context += `- Sex Distribution: ${JSON.stringify(results.sex_counts)}\n`;
    }
    if (results.trait_summaries) {
      context += "- Trait Summaries:\n";
      for (const [trait, summary] of Object.entries(results.trait_summaries)) {
        context += `  - ${trait}: ${JSON.stringify(summary)}\n`;
      }
    }
  }

  return context;
}

/**
 * Generate system prompt for simulation control
 */
export function generateSimulationSystemPrompt(): string {
  return `
You are a genetics simulation assistant. You can help users set up and run genetic crosses.

**Available Commands:**
You can execute commands by including them in your response in this format: [COMMAND:type:params]

Command Types:
1. Add trait: [COMMAND:add_trait:{"traitKey":"eye_color"}]
2. Remove trait: [COMMAND:remove_trait:{"traitKey":"eye_color"}]
3. Set allele: [COMMAND:set_allele:{"parent":"mother","geneId":"Eye","alleles":["B","b"]}]
4. Randomize alleles: [COMMAND:randomize_alleles:{"parent":"both"}]
5. Set simulation count: [COMMAND:set_count:{"count":5000}]
6. Run simulation: [COMMAND:run:{}]

**Example Workflow:**
User: "Add eye color trait and set it to brown for both parents, then run 1000 simulations"

Your response:
"I'll help you set up that simulation! Let me:
1. Add the eye color trait
2. Set both parents to brown eyes
3. Run 1000 simulations

[COMMAND:add_trait:{"traitKey":"eye_color"}]
[COMMAND:set_allele:{"parent":"mother","geneId":"Eye","alleles":["B","B"]}]
[COMMAND:set_allele:{"parent":"father","geneId":"Eye","alleles":["B","B"]}]
[COMMAND:set_count:{"count":1000}]
[COMMAND:run:{}]

All set! The simulation is running now. I'll show you the results when it's complete."

**Guidelines:**
- Always explain what you're doing before executing commands
- Execute commands in logical order
- Confirm successful completion
- If traits need to be added before setting alleles, add them first
- Use proper trait keys and gene IDs from the system
`;
}
