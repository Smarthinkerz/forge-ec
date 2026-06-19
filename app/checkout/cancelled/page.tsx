import { Button } from "@/components/ui/Button";
export const metadata = { title: "Checkout cancelled · ForgeEC" };
export default function CancelledPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-neg/20 text-neg text-2xl">×</div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Checkout didn&apos;t complete.</h1>
        <p className="text-dim mb-8">No charge was made. You can try again whenever you&apos;re ready.</p>
        <div className="flex items-center justify-center gap-3">
          <Button href="/#pricing">Back to pricing</Button>
          <Button href="/dashboard" variant="ghost">Go to dashboard</Button>
        </div>
      </div>
    </main>
  );
}
