import { describe, expect, it } from "vitest";
import {
  addClaimInputSchema,
  addSourceInputSchema,
  compareOptionsInputSchema,
  parseWebMCPInput,
  updateConfidenceInputSchema,
} from "@/lib/webmcp-inputs";

describe("WebMCP execution-time validation", () => {
  it("accepts a valid research source", () => {
    const input = parseWebMCPInput("deeptrail_add_source", addSourceInputSchema, {
      url: "https://example.com/research",
      title: "Research",
    });
    expect(input.url).toBe("https://example.com/research");
  });

  it("rejects script URLs even if a client bypasses JSON Schema UI", () => {
    expect(() =>
      parseWebMCPInput("deeptrail_add_source", addSourceInputSchema, {
        url: "javascript:alert(1)",
      }),
    ).toThrow(/http or https/i);
  });

  it("rejects oversized claim text", () => {
    expect(() =>
      parseWebMCPInput("deeptrail_add_claim", addClaimInputSchema, {
        text: "x".repeat(5001),
      }),
    ).toThrow(/invalid input/i);
  });

  it("rejects out-of-range confidence rather than clamping tool input", () => {
    expect(() =>
      parseWebMCPInput("deeptrail_update_confidence", updateConfidenceInputSchema, {
        claimId: "claim-1",
        confidence: 2,
        reason: "malformed value",
      }),
    ).toThrow(/invalid input/i);
  });

  it("requires at least two decision options", () => {
    expect(() =>
      parseWebMCPInput("deeptrail_compare_options", compareOptionsInputSchema, {
        title: "Only one option",
        options: [{ name: "A" }],
      }),
    ).toThrow(/invalid input/i);
  });

  it("rejects unknown properties", () => {
    expect(() =>
      parseWebMCPInput("deeptrail_add_claim", addClaimInputSchema, {
        text: "A claim",
        hiddenInstruction: "do something else",
      }),
    ).toThrow(/invalid input/i);
  });
});
