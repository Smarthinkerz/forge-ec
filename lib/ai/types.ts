// Provider-agnostic AI contract. Concrete providers implement AIProvider.
export type AITask = "site_audit" | "product_optimization" | "campaign_draft" | "generic";

export interface CompletionRequest {
  system: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  task: AITask;
}
export interface CompletionResponse { text: string; provider: string; model: string; }
export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
}
