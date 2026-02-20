export type SafetyLevel = "safe" | "caution" | "warning" | "danger" | "unknown";
export type EvidenceQuality = "strong" | "moderate" | "limited" | "none" | "unknown";

/** Source credibility hierarchy: FDA label > RCT > Meta analysis > Observational > Blog */
export type SourceTier =
  | "fda_label"
  | "rct"
  | "meta_analysis"
  | "observational"
  | "blog"
  | "unknown";

export interface Citation {
  title: string;
  url: string;
  snippet: string;
  favicon_url?: string;
  source_name?: string;
  /** When available from agent or URL parsing */
  source_tier?: SourceTier;
  doi?: string;
  pubmed_id?: string;
}

export interface ContraindicationAlert {
  population: string; // e.g. "Pregnancy", "Pediatrics", "Polypharmacy"
  summary: string;
  source?: string;
}

export interface RejectedSource {
  title: string;
  url: string;
  reason: string;
}

export interface ConflictingEvidence {
  claim_a: string;
  claim_b: string;
  source_a?: string;
  source_b?: string;
}

export interface AgentStepData {
  id: string;
  type: "planning" | "searching" | "search_results" | "reading" | "reasoning" | "agent_role" | "complete" | "error";
  content: string;
  sources?: Citation[];
  /** For agent_role type: e.g. "Research Agent", "Verifier Agent", "Safety Agent", "Bias Auditor". */
  role?: string;
  timestamp: number;
}

export interface HealthReport {
  safety_rating: SafetyLevel;
  evidence_level: EvidenceQuality;
  /** Quantified interaction/risk score 0–100 (higher = more risk). Derived from evidence weight, study size, recency. */
  risk_score?: number;
  summary: string;
  detailed_analysis: string;
  citations: Citation[];
  disclaimer: string;
  /** Context-aware disclaimer extras (e.g. pregnancy, pediatrics). */
  disclaimer_extras?: string[];
  /** Contraindication alerts for edge cases. */
  contraindication_alerts?: ContraindicationAlert[];
  /** When two sources disagree. */
  conflicting_evidence?: ConflictingEvidence[];
  /** Rejected sources and why (reasoning checkpoints). */
  rejected_sources?: RejectedSource[];
  /** Reproducible: exact queries run for replay. */
  query_log?: string[];
  /** Pipeline roles that contributed (explainable). */
  agent_roles_used?: string[];
  /** True when You.com API credits were unavailable; response is limited. */
  credits_unavailable?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStepData[];
  report?: HealthReport;
  timestamp: number;
}

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  snippets: string[];
  thumbnail_url?: string;
  page_age?: string;
  favicon_url?: string;
}

export interface SearchResponse {
  results: {
    web?: SearchResult[];
    news?: SearchResult[];
  };
  metadata?: {
    query: string;
    latency: number;
  };
}

export interface ContentsResult {
  url: string;
  title: string;
  markdown: string | null;
  html: string | null;
}

export interface AgentOutput {
  text?: string;
  type: string;
  content?: {
    source_type: string;
    citation_uri: string;
    title: string;
    snippet: string;
    url: string;
    thumbnail_url?: string;
  }[];
}

export interface AgentResponse {
  agent: string;
  input: { role: string; content: string }[];
  output: AgentOutput[];
}

export type SSEEvent =
  | { type: "planning"; tasks: string[] }
  | { type: "searching"; query: string }
  | { type: "search_results"; sources: Citation[] }
  | { type: "reading"; url: string; title: string }
  | { type: "reasoning"; thought: string }
  | { type: "agent_role"; role: string }
  | { type: "safety_rating"; rating: SafetyLevel }
  | { type: "evidence_level"; level: EvidenceQuality }
  | { type: "report_chunk"; markdown: string }
  | { type: "citations"; sources: Citation[] }
  | { type: "complete"; report: HealthReport }
  | { type: "error"; message: string };

export interface ResearchMode {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  example: string;
  color: string;
}

// --- Health Goals ---

export type GoalCategory =
  | "nutrition"
  | "exercise"
  | "sleep"
  | "supplements"
  | "mental_health"
  | "hydration"
  | "custom";

export type GoalStatus = "active" | "completed" | "paused";

export interface HealthGoal {
  id: string;
  title: string;
  category: GoalCategory;
  status: GoalStatus;
  target: string;
  progress: number; // 0-100
  createdAt: number;
  updatedAt: number;
  tips?: GoalTip[];
  notificationsEnabled: boolean;
}

export interface GoalTip {
  id: string;
  text: string;
  highlights: string[];
  source?: string;
  sourceUrl?: string;
  fetchedAt: number;
}

export interface GoalNotification {
  id: string;
  goalId: string;
  goalTitle: string;
  tip: string;
  source?: string;
  sourceUrl?: string;
  read: boolean;
  createdAt: number;
}
