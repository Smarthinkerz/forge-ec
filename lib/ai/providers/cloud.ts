// Real providers via fetch (no SDK). Activate only when their key is set.
import type { AIProvider, CompletionRequest, CompletionResponse } from "@/lib/ai/types";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private key = process.env.OPENAI_API_KEY;
  private model = process.env.OPENAI_MODEL ?? "gpt-4.1";
  isConfigured() { return Boolean(this.key); }
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` },
      body: JSON.stringify({
        model: this.model, temperature: req.temperature ?? 0.7, max_tokens: req.maxTokens ?? 1500,
        ...(req.json ? { response_format: { type: "json_object" } } : {}),
        messages: [{ role: "system", content: req.system }, { role: "user", content: req.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const d = await res.json();
    return { text: d.choices?.[0]?.message?.content ?? "", provider: this.name, model: this.model };
  }
}

export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private key = process.env.ANTHROPIC_API_KEY;
  private model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";
  isConfigured() { return Boolean(this.key); }
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": this.key!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: this.model, max_tokens: req.maxTokens ?? 1500, temperature: req.temperature ?? 0.7,
        system: req.system + (req.json ? "\n\nRespond with valid JSON only." : ""),
        messages: [{ role: "user", content: req.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const d = await res.json();
    return { text: d.content?.[0]?.text ?? "", provider: this.name, model: this.model };
  }
}

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private key = process.env.GOOGLE_GEMINI_API_KEY;
  private model = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";
  isConfigured() { return Boolean(this.key); }
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.key}`;
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        generationConfig: { temperature: req.temperature ?? 0.7, maxOutputTokens: req.maxTokens ?? 1500, ...(req.json ? { responseMimeType: "application/json" } : {}) },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const d = await res.json();
    const text = d.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join("") ?? "";
    return { text, provider: this.name, model: this.model };
  }
}
