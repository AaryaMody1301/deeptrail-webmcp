export type QuestionStatus = "open" | "answered";
export type ClaimStance = "supports" | "contradicts" | "neutral";
export type EvidenceRelationship = "supports" | "contradicts" | "qualifies";
export type ActivityActor = "human" | "agent" | "system";
export type GapPriority = "high" | "medium" | "low";
export type GapKind =
  | "unresolved_question"
  | "unsupported_claim"
  | "missing_counterevidence"
  | "thin_provenance";
export type CounterargumentStrength = "weak" | "moderate" | "strong";
export type DecisionStatus = "draft" | "final";
export type ActivityType =
  | "investigation_created"
  | "question_added"
  | "question_updated"
  | "source_added"
  | "source_updated"
  | "claim_added"
  | "claim_updated"
  | "evidence_linked"
  | "note_added"
  | "note_updated"
  | "research_gaps_refreshed"
  | "counterargument_added"
  | "confidence_updated"
  | "comparison_added"
  | "decision_recorded";

export interface ResearchQuestion {
  id: string;
  text: string;
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher?: string;
  summary?: string;
  publishedAt?: string;
  accessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  text: string;
  stance: ClaimStance;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceLink {
  id: string;
  sourceId: string;
  claimId: string;
  relationship: EvidenceRelationship;
  note?: string;
  createdAt: string;
}

export interface ResearchNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchGap {
  id: string;
  key: string;
  kind: GapKind;
  title: string;
  detail: string;
  priority: GapPriority;
  relatedId?: string;
  createdAt: string;
}

export interface Counterargument {
  id: string;
  text: string;
  strength: CounterargumentStrength;
  targetClaimId?: string;
  sourceIds: string[];
  createdAt: string;
}

export interface ConfidenceChange {
  id: string;
  claimId: string;
  previousConfidence: number;
  newConfidence: number;
  reason: string;
  createdAt: string;
}

export interface DecisionOption {
  id: string;
  name: string;
  summary: string;
  pros: string[];
  cons: string[];
  score: number;
}

export interface OptionComparison {
  id: string;
  title: string;
  criteria: string[];
  options: DecisionOption[];
  recommendation?: string;
  rationale?: string;
  createdAt: string;
}

export interface DecisionRecord {
  id: string;
  choice: string;
  rationale: string;
  confidence: number;
  status: DecisionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  actor: ActivityActor;
  message: string;
  entityId?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  title: string;
  primaryQuestion: string;
  createdAt: string;
  updatedAt: string;
  questions: ResearchQuestion[];
  sources: Source[];
  claims: Claim[];
  evidenceLinks: EvidenceLink[];
  notes: ResearchNote[];
  researchGaps: ResearchGap[];
  counterarguments: Counterargument[];
  confidenceHistory: ConfidenceChange[];
  comparisons: OptionComparison[];
  decision?: DecisionRecord;
  activity: ActivityEntry[];
}

export interface AddSourceInput {
  url: string;
  title?: string;
  publisher?: string;
  summary?: string;
  publishedAt?: string;
}

export interface UpdateSourceInput {
  url?: string;
  title?: string;
  publisher?: string;
  summary?: string;
  publishedAt?: string;
}

export interface AddClaimInput {
  text: string;
  stance?: ClaimStance;
  confidence?: number;
}

export interface UpdateClaimInput {
  text?: string;
  stance?: ClaimStance;
  confidence?: number;
}

export interface LinkEvidenceInput {
  sourceId: string;
  claimId: string;
  relationship: EvidenceRelationship;
  note?: string;
}

export interface AddCounterargumentInput {
  text: string;
  strength?: CounterargumentStrength;
  targetClaimId?: string;
  sourceIds?: string[];
}

export interface UpdateConfidenceInput {
  claimId: string;
  confidence: number;
  reason: string;
}

export interface CompareOptionInput {
  name: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  score?: number;
}

export interface CompareOptionsInput {
  title: string;
  criteria?: string[];
  options: CompareOptionInput[];
  recommendation?: string;
  rationale?: string;
}

export interface RecordDecisionInput {
  choice: string;
  rationale: string;
  confidence?: number;
  status?: DecisionStatus;
}
