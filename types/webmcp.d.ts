export {};

declare global {
  interface WebMCPToolAnnotations {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  }

  interface WebMCPToolDefinition {
    name: string;
    title?: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: WebMCPToolAnnotations;
    execute: (
      input: Record<string, unknown>,
      context?: { signal?: AbortSignal },
    ) => unknown | Promise<unknown>;
  }

  interface ModelContext {
    registerTool: (
      tool: WebMCPToolDefinition,
      options?: { signal?: AbortSignal; exposedTo?: string[] },
    ) => void | Promise<void>;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
