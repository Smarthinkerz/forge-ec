import type { MessagingProvider, MessagingAdapter, MessagingCredentials } from "@/lib/messaging/types";
import { MockMessagingAdapter } from "@/lib/messaging/mock";
import { KlaviyoAdapter, MailchimpAdapter, TwilioAdapter } from "@/lib/messaging/real";
const REAL: Partial<Record<MessagingProvider, () => MessagingAdapter>> = {
  klaviyo: () => new KlaviyoAdapter(), mailchimp: () => new MailchimpAdapter(), twilio: () => new TwilioAdapter(),
};
export function getMessagingAdapter(provider: MessagingProvider, creds: MessagingCredentials = {}): MessagingAdapter {
  const real = REAL[provider]?.();
  if (real && real.isConfigured(creds)) return real;
  return new MockMessagingAdapter();
}
export const MESSAGING_PROVIDERS: { id: MessagingProvider; label: string }[] = [
  { id: "klaviyo", label: "Klaviyo" }, { id: "mailchimp", label: "Mailchimp" }, { id: "twilio", label: "Twilio (SMS)" },
];
