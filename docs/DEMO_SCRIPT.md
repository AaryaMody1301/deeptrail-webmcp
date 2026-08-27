# DeepTrail Demo Script — Target 2:35

This script is optimized for the OpenAI WebMCP Challenge. Keep the recording under 3:00. Use the production `/judge` page and a clean browser profile.

## 0:00–0:18 — Problem

**Screen:** `/judge`, hero visible.

**Voiceover:**

“AI can research the web quickly, but the reasoning trail is usually trapped across tabs and chat history. DeepTrail is a WebMCP-native workspace where a human and browser agent investigate the web together, and every source, claim, counterargument, confidence change, and decision stays inspectable.”

## 0:18–0:35 — Why WebMCP

**Screen:** readiness cards, then scroll to judging-criteria cards.

**Voiceover:**

“WebMCP is the collaboration layer. Instead of scraping this interface or clicking through forms, the browser agent gets structured tools for DeepTrail’s actual research model. Those tools mutate the same visible state I’m using.”

## 0:35–0:50 — Load the real seeded investigation

**Action:** Click **Load evidence-backed judge demo**.

**Screen:** workspace opens. Briefly show primary question and metrics.

**Voiceover:**

“The demo is deliberately not a perfect canned answer. It asks where DeepTrail itself should ship for this challenge. There is a draft recommendation, contrary evidence, and unresolved production verification.”

## 0:50–1:12 — Show inspectable reasoning

**Screen:** scroll through evidence graph, Research Debt, counterargument, confidence history, and draft decision.

**Voiceover:**

“Sources connect to claims as support, contradiction, or qualification. Counterarguments are first-class objects. Research Debt is deterministic, based on structural gaps rather than model vibes. And confidence history records why a belief changed.”

## 1:12–1:28 — Attack this conclusion

**Screen:** show **Attack this conclusion** and **What would change my mind?**.

**Voiceover:**

“The key interaction is Attack this conclusion. Before more research, I can define what evidence would change my mind. DeepTrail stores a confidence baseline and asks the agent to search specifically for credible falsifying or materially qualifying evidence—not just agree with me.”

## 1:28–2:05 — WebMCP live interaction

**Action:** Use the exact judge prompt. Keep the agent/tool-call UI visible if possible.

**Voiceover while the agent works:**

“The agent reads stable IDs and open gaps through WebMCP, researches the live web, adds a source with provenance, writes or refines a claim, links the evidence, and records a counterargument or confidence change only when the evidence warrants it.”

**Important capture:** Show at least one WebMCP tool call and the corresponding DeepTrail UI mutation. This is the most important footage in the video.

## 2:05–2:25 — Human + agent shared state

**Screen:** show updated evidence graph/activity/confidence/Research Debt.

**Voiceover:**

“The result is not hidden reasoning. I can inspect exactly what changed, who changed it, which source caused it, and whether the decision should remain draft. The human stays in control of the conclusion.”

## 2:25–2:35 — Close

**Screen:** top of workspace or judge criteria cards.

**Voiceover:**

“DeepTrail turns web research from disposable AI prose into durable, challengeable evidence state. No paid model API, no backend—just the browser agent, WebMCP, and a local-first workspace.”

## Recording checklist

- Record at 1080p or better.
- Use production, not localhost.
- Start from a clean profile with no existing DeepTrail IndexedDB workspace.
- Verify `/judge` readiness checks before recording.
- Keep browser zoom near 100% unless smaller zoom materially improves framing.
- Make the WebMCP tool call visible at least once.
- Do not spend video time reading JSON schemas or code.
- Avoid copyrighted music and unrelated third-party brand assets.
- Keep total duration below 2:50 to leave safety margin under the 3:00 rule.
- Upload publicly to YouTube and test the link in an incognito window before submission.
