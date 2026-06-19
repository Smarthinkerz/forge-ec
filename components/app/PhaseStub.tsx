import { Card } from "@/components/ui/Card";
export function PhaseStub({ title, phase, desc }: { title: string; phase: string; desc: string }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card className="p-10 text-center">
        <span className="inline-block rounded-full bg-surface-2 px-3 py-1 text-xs text-dim mb-3">{phase}</span>
        <p className="text-dim max-w-md mx-auto">{desc}</p>
      </Card>
    </div>
  );
}
