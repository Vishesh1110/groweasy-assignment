"use client";

const STEPS = ["Upload", "Preview", "Confirm", "Result"] as const;

export default function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-0 font-mono text-xs uppercase tracking-wide">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const state = step < current ? "done" : step === current ? "active" : "pending";
        return (
          <li key={label} className="flex items-center">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border tabular
                ${state === "done" ? "border-accent bg-accent/10 text-accent" : ""}
                ${state === "active" ? "border-accent2 bg-accent2/10 text-accent2" : ""}
                ${state === "pending" ? "border-line text-mute" : ""}`}
            >
              {state === "done" ? "✓" : step}
            </span>
            <span
              className={`ml-2 mr-4 ${
                state === "pending" ? "text-mute" : state === "active" ? "text-accent2" : "text-accent"
              }`}
            >
              {label}
            </span>
            {step !== STEPS.length && <span className="mr-4 h-px w-8 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}
