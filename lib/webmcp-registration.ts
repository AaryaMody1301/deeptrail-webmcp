export type WebMCPApiSource = "document" | "navigator";

export interface WebMCPContextSelection {
  context: ModelContext | null;
  source: WebMCPApiSource | null;
}

export function selectWebMCPContext(
  documentContext?: ModelContext | null,
  navigatorContext?: ModelContext | null,
): WebMCPContextSelection {
  if (documentContext && typeof documentContext.registerTool === "function") {
    return { context: documentContext, source: "document" };
  }

  if (navigatorContext && typeof navigatorContext.registerTool === "function") {
    return { context: navigatorContext, source: "navigator" };
  }

  return { context: null, source: null };
}

export async function registerWebMCPTools(
  context: Pick<ModelContext, "registerTool">,
  tools: WebMCPToolDefinition[],
  signal: AbortSignal,
): Promise<number> {
  let registeredCount = 0;

  for (const tool of tools) {
    if (signal.aborted) return registeredCount;
    await context.registerTool(tool, { signal });
    registeredCount += 1;
    if (signal.aborted) return registeredCount;
  }

  return registeredCount;
}
