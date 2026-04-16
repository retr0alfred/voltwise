import { Cpu, Target } from "lucide-react";

function PredictionsPlaceholder(): JSX.Element {
  return (
    <section className="card fade-in flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--border-soft)] bg-gradient-to-b from-[rgba(123,158,175,0.14)] via-[rgba(181,166,201,0.1)] to-transparent px-8 py-14 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white">
          <Target className="h-7 w-7 text-[var(--pastel-blue)]" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Predictions Engine</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
          AI-powered BUY / SELL / HOLD recommendations coming soon. Backend integration in progress.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <Cpu className="h-4 w-4 text-[var(--pastel-lavender)]" aria-hidden="true" />
          Model orchestration pipeline in progress
        </div>

        {/* TODO: Inject forecast input form UI here (date/time horizon, region, market conditions). */}
        {/* TODO: Inject model output panel here (BUY / SELL / HOLD + confidence + rationale). */}
        {/* TODO: Inject SHAP explanation visualization panel here for explainable AI breakdown. */}
        {/* TODO: Inject AI Agent Bot chat window here for strategy Q&A and scenario simulation. */}
      </div>
    </section>
  );
}

export default PredictionsPlaceholder;
