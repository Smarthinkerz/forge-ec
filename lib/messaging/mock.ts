import type { MessagingAdapter, MessagingChannel, MessagingProvider, MessagingCredentials } from "@/lib/messaging/types";
export class MockMessagingAdapter implements MessagingAdapter {
  provider: MessagingProvider = "mock";
  channel: MessagingChannel;
  requiredCredentials: string[] = [];
  constructor(channel: MessagingChannel = "both") { this.channel = channel; }
  isConfigured() { return true; }
  async getAudienceSize() { await new Promise((r) => setTimeout(r, 150)); return 12480; }
}
