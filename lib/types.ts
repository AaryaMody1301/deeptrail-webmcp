export type QuestionStatus = "open" | "answered";
export type ClaimStance = "supports" | "contradicts" | "neutral";
export type EvidenceRelationship = "supports" | "contradicts" | "qualifies";

export interface ResearchQuestion {
  id: string;
  text: string;
  status: QuestionStatus;
  createdAt: string;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher?: string;
  summary?: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  text: string;
  stance: ClaimStance;
  confidence: number;
  createdAt: string;
}

export interface EvidenceLink {
  id: string;
  sourceId: string;
  claimId: string;
  relationship: EvidenceRelationship;
  note?: string;
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
}

export interface AddSourceInput {
  url: string;
  title?: string;
  publisher?: string;
  summary?: string;
}

export interface AddClaimInput {
  text: string;
  stance?: ClaimStance;
  confidence?: number;
}

export interface LinkEvidenceInput {
  sourceId: string;
  claimId: string;
  relationship: EvidenceRelationship;
  note?: string;
}
