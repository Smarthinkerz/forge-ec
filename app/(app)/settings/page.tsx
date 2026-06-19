import { BillingClient } from "@/components/billing/BillingClient";
import { ApiBrandingClient } from "@/components/settings/ApiBrandingClient";
import { getBillingState } from "@/lib/billing/usage";
export const metadata = { title: "Settings · ForgeEC" };
export default async function SettingsPage() {
  const { plan, usage, isReal } = await getBillingState();
  return (
    <div className="space-y-8">
      <BillingClient plan={plan} usage={usage} isReal={isReal} />
      <ApiBrandingClient />
    </div>
  );
}
