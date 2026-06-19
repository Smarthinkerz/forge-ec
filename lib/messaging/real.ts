// Real email/SMS provider skeletons. Activate when credentials are present and
// the calls are implemented; until then the registry uses the sandbox adapter.
import type { MessagingAdapter, MessagingChannel, MessagingProvider, MessagingCredentials } from "@/lib/messaging/types";
class NotImplemented extends Error { constructor(n: string) { super(`${n} messaging adapter not implemented — add credentials & implement getAudienceSize(). See docs/INTEGRATIONS.md`); } }
abstract class Base implements MessagingAdapter {
  abstract provider: MessagingProvider; abstract channel: MessagingChannel; abstract requiredCredentials: string[];
  isConfigured(c: MessagingCredentials): boolean { return this.requiredCredentials.every((k) => Boolean(c[k])); }
  abstract getAudienceSize(c: MessagingCredentials): Promise<number>;
}
/** Klaviyo (email+SMS) — creds: apiKey. GET /api/profiles or list size. */
export class KlaviyoAdapter extends Base {
  provider: MessagingProvider = "klaviyo"; channel: MessagingChannel = "both"; requiredCredentials = ["apiKey"];
  async getAudienceSize(): Promise<number> { throw new NotImplemented("Klaviyo"); }
}
/** Mailchimp (email) — creds: apiKey, serverPrefix, listId. GET /lists/{id}. */
export class MailchimpAdapter extends Base {
  provider: MessagingProvider = "mailchimp"; channel: MessagingChannel = "email"; requiredCredentials = ["apiKey", "serverPrefix", "listId"];
  async getAudienceSize(): Promise<number> { throw new NotImplemented("Mailchimp"); }
}
/** Twilio (SMS) — creds: accountSid, authToken, fromNumber. */
export class TwilioAdapter extends Base {
  provider: MessagingProvider = "twilio"; channel: MessagingChannel = "sms"; requiredCredentials = ["accountSid", "authToken", "fromNumber"];
  async getAudienceSize(): Promise<number> { throw new NotImplemented("Twilio"); }
}
