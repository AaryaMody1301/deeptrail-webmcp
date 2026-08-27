export type QuestionStatus = "open" | "answered";
export type ClaimStance = "supports" | "contradicts" | "neutral";
export type EvidenceRelationship = "supports" | "contradicts" | "qualifies";
export type ActivityActor = "human" | "agent" | "system";
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
  | "note_updated";

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
