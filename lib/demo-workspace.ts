import type { Workspace } from "@/lib/types";
import { validateWorkspace } from "@/lib/workspace-schema";

export const JUDGE_AGENT_PROMPT = `Read the active DeepTrail investigation through WebMCP. Treat the current draft decision as a hypothesis, not a conclusion. First inspect the open production-verification questions and existing evidence. Then search for the strongest credible evidence that could falsify or materially qualify the current hosting recommendation. Add any new source with provenance, add or refine the relevant claim, link the evidence, record a counterargument if warranted, and update confidence only if the evidence justifies a change. Refresh research gaps at the end. Do not manufacture disagreement.`;

export function createJudgeDemoWorkspace(): Workspace {
  const timestamp = new Date().toISOString();

  return validateWorkspace({
    id: "demo-workspace-deployment",
    title: "Where should DeepTrail ship for the WebMCP Challenge?",
    primaryQuestionId: "demo-question-primary",
    primaryQuestion:
      "Which zero-cost production host gives DeepTrail the lowest deployment risk while preserving the response headers and browser behavior required for WebMCP?",
    createdAt: timestamp,
    updatedAt: timestamp,
    questions: [
      {
        id: "demo-question-production-browser",
        text: "Does the final production URL register the complete DeepTrail WebMCP toolset in ChatGPT's in-app browser and Chrome 149+?",
        status: "open",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-question-production-headers",
        text: "Do production responses include Origin-Agent-Cluster: ?1 and Permissions-Policy: tools=(self)?",
        status: "open",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-question-primary",
        text: "Which zero-cost production host gives DeepTrail the lowest deployment risk while preserving the response headers and browser behavior required for WebMCP?",
        status: "answered",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    sources: [
      {
        id: "demo-source-chrome-webmcp",
        url: "https://developer.chrome.com/docs/ai/webmcp",
        title: "WebMCP",
        publisher: "Chrome for Developers",
        summary:
          "Chrome documents local WebMCP testing through the enable-webmcp-testing flag and describes the browser WebMCP APIs used by DeepTrail.",
        accessedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-source-cloudflare-headers",
        url: "https://developers.cloudflare.com/pages/configuration/headers/",
        title: "Headers · Cloudflare Pages docs",
        publisher: "Cloudflare",
        summary:
          "Cloudflare Pages supports custom response headers for static assets through a project _headers file.",
        publishedAt: "2026-08-25",
        accessedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-source-cloudflare-nextjs",
        url: "https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/",
        title: "Deploy a static Next.js site",
        publisher: "Cloudflare",
        summary:
          "Cloudflare documents deploying a statically exported Next.js project from an existing GitHub repository to Pages.",
        publishedAt: "2026-08-25",
        accessedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-source-vercel-terms",
        url: "https://vercel.com/legal/terms",
        title: "Vercel Terms of Service",
        publisher: "Vercel",
        summary:
          "Vercel's free Hobby plan is offered for personal or non-commercial use, which fits a personal hackathon demo but remains an important deployment constraint to record.",
        publishedAt: "2026-06-01",
        accessedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-source-vercel-deploy",
        url: "https://vercel.com/academy/ai-summary-app-with-nextjs/deploy-the-app",
        title: "Deploy the App",
        publisher: "Vercel Academy",
        summary:
          "Vercel documents importing a GitHub repository, auto-detecting Next.js, and deploying without custom infrastructure setup.",
        accessedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    claims: [
      {
        id: "demo-claim-production-verification",
        text: "The decisive release gate is production WebMCP verification in the judge-supported browser path, not merely a successful Next.js build.",
        stance: "supports",
        confidence: 0.92,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-claim-cloudflare-fallback",
        text: "Cloudflare Pages is a credible zero-cost fallback because a static Next.js export can deploy from GitHub and static responses can receive custom headers through _headers.",
        stance: "supports",
        confidence: 0.91,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-claim-vercel-hobby-constraint",
        text: "Vercel Hobby costs $0 but is restricted by its terms to personal or non-commercial use.",
        stance: "neutral",
        confidence: 0.96,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-claim-vercel-friction",
        text: "Vercel is the lowest-friction first deployment path for the current DeepTrail codebase because it directly imports GitHub Next.js projects and preserves framework-level deployment behavior without a static-export migration.",
        stance: "supports",
        confidence: 0.86,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    evidenceLinks: [
      {
        id: "demo-link-chrome-verification",
        sourceId: "demo-source-chrome-webmcp",
        claimId: "demo-claim-production-verification",
        relationship: "supports",
        note: "The judge-supported Chrome path requires WebMCP to be enabled and verified in the browser.",
        createdAt: timestamp,
      },
      {
        id: "demo-link-cloudflare-headers",
        sourceId: "demo-source-cloudflare-headers",
        claimId: "demo-claim-cloudflare-fallback",
        relationship: "supports",
        note: "Cloudflare documents _headers for static asset responses.",
        createdAt: timestamp,
      },
      {
        id: "demo-link-cloudflare-nextjs",
        sourceId: "demo-source-cloudflare-nextjs",
        claimId: "demo-claim-cloudflare-fallback",
        relationship: "supports",
        note: "Cloudflare documents Git-based static Next.js deployment to Pages.",
        createdAt: timestamp,
      },
      {
        id: "demo-link-vercel-terms",
        sourceId: "demo-source-vercel-terms",
        claimId: "demo-claim-vercel-hobby-constraint",
        relationship: "supports",
        note: "The Hobby-plan use restriction is stated in Vercel's current terms.",
        createdAt: timestamp,
      },
      {
        id: "demo-link-vercel-deploy",
        sourceId: "demo-source-vercel-deploy",
        claimId: "demo-claim-vercel-friction",
        relationship: "supports",
        note: "Vercel's documented path imports a GitHub repo and auto-detects Next.js.",
        createdAt: timestamp,
      },
      {
        id: "demo-link-cloudflare-qualifies-vercel",
        sourceId: "demo-source-cloudflare-nextjs",
        claimId: "demo-claim-vercel-friction",
        relationship: "qualifies",
        note: "A credible Cloudflare route means Vercel is a convenience choice, not the only viable host.",
        createdAt: timestamp,
      },
    ],
    notes: [
      {
        id: "demo-note-falsification",
        title: "What would change my mind",
        content:
          "If production testing shows Vercel does not expose the required WebMCP capability or security headers reliably in the judge-supported browser path, switch to Cloudflare Pages or another host before submission.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    researchGaps: [
      {
        id: "demo-gap-browser",
        key: "unresolved:demo-question-production-browser",
        kind: "unresolved_question",
        title: "Production WebMCP browser verification is still open",
        detail:
          "The final deployed origin must be tested in ChatGPT's in-app browser and Chrome 149+ before the hosting decision can be finalized.",
        priority: "high",
        relatedId: "demo-question-production-browser",
        createdAt: timestamp,
      },
      {
        id: "demo-gap-headers",
        key: "unresolved:demo-question-production-headers",
        kind: "unresolved_question",
        title: "Production response headers are not yet verified",
        detail:
          "Verify Origin-Agent-Cluster and the tools permissions policy on the actual production response rather than assuming local behavior is preserved.",
        priority: "high",
        relatedId: "demo-question-production-headers",
        createdAt: timestamp,
      },
    ],
    counterarguments: [
      {
        id: "demo-counterargument-cloudflare",
        text: "Cloudflare weakens the claim that Vercel is uniquely low-risk: this app is predominantly client-side, Cloudflare Pages supports static Next.js exports, and Pages can apply the required response headers through _headers.",
        strength: "strong",
        targetClaimId: "demo-claim-vercel-friction",
        sourceIds: ["demo-source-cloudflare-nextjs", "demo-source-cloudflare-headers"],
        createdAt: timestamp,
      },
    ],
    confidenceHistory: [
      {
        id: "demo-confidence-vercel",
        claimId: "demo-claim-vercel-friction",
        previousConfidence: 0.91,
        newConfidence: 0.86,
        reason:
          "Confidence was reduced after confirming that Cloudflare Pages provides a credible static Next.js and custom-header fallback.",
        createdAt: timestamp,
      },
    ],
    comparisons: [
      {
        id: "demo-comparison-hosting",
        title: "Hackathon production host",
        criteria: [
          "Zero cash cost",
          "Migration effort",
          "Next.js compatibility",
          "Required response headers",
          "Fast fallback path",
        ],
        options: [
          {
            id: "demo-option-vercel",
            name: "Vercel Hobby",
            summary: "Direct GitHub-to-Next.js deployment with minimal code change.",
            pros: [
              "No migration from the current Next.js deployment model",
              "GitHub import and Next.js auto-detection are documented",
              "Existing next.config.ts header strategy can remain the primary path",
            ],
            cons: [
              "Hobby is limited by terms to personal/non-commercial use",
              "Production WebMCP behavior still needs browser verification",
            ],
            score: 90,
          },
          {
            id: "demo-option-cloudflare",
            name: "Cloudflare Pages",
            summary: "Strong zero-cost fallback using a static Next.js export and _headers.",
            pros: [
              "Git-integrated Pages deployment",
              "Custom headers supported for static responses",
              "Good fallback if the primary production path fails verification",
            ],
            cons: [
              "Requires adapting the current project to a static export",
              "Header configuration would move from next.config.ts to _headers for static Pages",
            ],
            score: 82,
          },
        ],
        recommendation: "Deploy to Vercel first and keep Cloudflare Pages as the documented fallback.",
        rationale:
          "The hackathon deadline favors the path with the fewest code changes, but the decision remains draft until the live origin passes browser/WebMCP and response-header checks.",
        createdAt: timestamp,
      },
    ],
    decision: {
      id: "demo-decision-hosting",
      choice: "Deploy the hackathon demo on Vercel first; keep Cloudflare Pages as a documented fallback.",
      rationale:
        "Vercel currently has the lowest migration risk for this Next.js codebase. The recommendation is intentionally draft because production WebMCP registration and required response headers must still be verified on the final live origin.",
      confidence: 0.78,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    activity: [
      {
        id: "demo-activity-decision",
        type: "decision_recorded",
        actor: "agent",
        message: "Recorded a draft deployment decision while preserving two production verification gates.",
        entityId: "demo-decision-hosting",
        createdAt: timestamp,
      },
      {
        id: "demo-activity-comparison",
        type: "comparison_added",
        actor: "agent",
        message: "Compared Vercel Hobby and Cloudflare Pages against hackathon deployment constraints.",
        entityId: "demo-comparison-hosting",
        createdAt: timestamp,
      },
      {
        id: "demo-activity-counterargument",
        type: "counterargument_added",
        actor: "agent",
        message: "Added Cloudflare Pages as a strong counterargument to the lowest-friction Vercel claim.",
        entityId: "demo-counterargument-cloudflare",
        createdAt: timestamp,
      },
      {
        id: "demo-activity-gaps",
        type: "research_gaps_refreshed",
        actor: "agent",
        message: "Kept live-browser and response-header verification as high-priority research gaps.",
        createdAt: timestamp,
      },
      {
        id: "demo-activity-created",
        type: "investigation_created",
        actor: "system",
        message: "Loaded the evidence-backed DeepTrail judge demonstration.",
        createdAt: timestamp,
      },
    ],
  });
}
