// Email/SMS provider adapter contract (same sandbox-first pattern as stores/channels).
export type MessagingProvider = "klaviyo" | "mailchimp" | "twilio" | "mock";
export type MessagingChannel = "email" | "sms" | "both";
export type MessagingCredentials = Record<string, string>;

export interface MessagingAdapter {
  provider: MessagingProvider;
  channel: MessagingChannel;
  requiredCredentials: string[];
  isConfigured(creds: MessagingCredentials): boolean;
  /** Audience reachable through this provider (mock returns a sample size). */
  getAudienceSize(creds: MessagingCredentials): Promise<number>;
}
