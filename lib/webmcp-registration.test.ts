import { describe, expect, it, vi } from "vitest";
import { registerWebMCPTools, selectWebMCPContext } from "@/lib/webmcp-registration";

function tool(name: string): WebMCPToolDefinition {
  return {
    name,
    description: `Tool ${name}`,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: async () => "ok",
  };
}

describe("WebMCP registration lifecycle", () => {
  it("prefers document.modelContext over the legacy navigator surface", () => {
    const documentContext = { registerTool: vi.fn() } as unknown as ModelContext;
    const navigatorContext = { registerTool: vi.fn() } as unknown as ModelContext;

    expect(selectWebMCPContext(documentContext, navigatorContext)).toEqual({
      context: documentContext,
      source: "document",
    });
  });

  it("uses navigator.modelContext only as a compatibility fallback", () => {
    const navigatorContext = { registerTool: vi.fn() } as unknown as ModelContext;

    expect(selectWebMCPContext(undefined, navigatorContext)).toEqual({
      context: navigatorContext,
      source: "navigator",
    });
    expect(selectWebMCPContext()).toEqual({ context: null, source: null });
  });

  it("awaits each registration and passes the lifecycle signal", async () => {
    const calls: string[] = [];
    const registerTool = vi.fn(async (registeredTool: WebMCPToolDefinition, options?: { signal?: AbortSignal }) => {
      calls.push(`start:${registeredTool.name}`);
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      calls.push(`finish:${registeredTool.name}`);
    });
    const controller = new AbortController();

    const count = await registerWebMCPTools(
      { registerTool } as unknown as ModelContext,
      [tool("one"), tool("two")],
      controller.signal,
    );

    expect(count).toBe(2);
    expect(calls).toEqual(["start:one", "finish:one", "start:two", "finish:two"]);
  });

  it("does not start a registration after cleanup aborts the lifecycle", async () => {
    const controller = new AbortController();
    controller.abort();
    const registerTool = vi.fn();

    const count = await registerWebMCPTools(
      { registerTool } as unknown as ModelContext,
      [tool("one")],
      controller.signal,
    );

    expect(count).toBe(0);
    expect(registerTool).not.toHaveBeenCalled();
  });
});
