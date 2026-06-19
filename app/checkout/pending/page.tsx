import { Button } from "@/components/ui/Button";
export const metadata = { title: "Payment pending · ForgeEC" };
export default function PendingPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-cyan/20 text-cyan text-2xl">…</div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Payment is processing.</h1>
        <p className="text-dim mb-8">We&apos;ll upgrade your workspace automatically once it clears. You can check back shortly.</p>
        <Button href="/dashboard">Go to dashboard</Button>
      </div>
    </main>
  );
}
