import { Button } from "@/components/ui/Button";
export const metadata = { title: "Payment successful · ForgeEC" };
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ plan?: string; simulated?: string }> }) {
  const { plan, simulated } = await searchParams;
  const name = plan ? plan[0].toUpperCase() + plan.slice(1) : "new";
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-forge text-white text-2xl">✓</div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">You&apos;re on the {name} plan.</h1>
        <p className="text-dim mb-8">
          {simulated
            ? "Simulated checkout (no Tap keys set yet) — your workspace was upgraded so you can test access to plan features."
            : "Payment received. Your workspace has been upgraded and all plan features are unlocked."}
        </p>
        <Button href="/dashboard">Go to dashboard</Button>
      </div>
    </main>
  );
}
