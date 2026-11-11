import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "@/core/storage";
import { useProfile } from "@/modules/profile/ProfileContext";
import { STEPS } from "./stepRegistry";

/** Generic flow: progress, back/next, validation, resume where the user left off. */
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { profile } = useProfile();
  const [index, setIndex] = useState(() => Math.min(storage.get("onboardingStep", 0), STEPS.length - 1));
  const finishRef = useRef<(() => void) | null>(null);

  useEffect(() => storage.set("onboardingStep", index), [index]);

  const registerFinish = useCallback((fn: () => void) => {
    finishRef.current = fn;
  }, []);

  const step = STEPS[index];
  const error = step.validate?.(profile) ?? null;
  const isLast = index === STEPS.length - 1;
  const Current = step.component;

  const next = () => {
    if (error) return;
    if (isLast) {
      finishRef.current?.();
      storage.remove("onboardingStep");
      onComplete();
    } else setIndex(index + 1);
  };

  return (
    <div className="shell">
      <div className="progress">
        <div className="progress-label">
          Step {index + 1} of {STEPS.length} · {step.title}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="card">
        <Current registerFinish={registerFinish} />
      </div>

      <div className="nav">
        <button className="btn btn-ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Back
        </button>
        <div className="nav-right">
          {error && <span className="error">{error}</span>}
          <button className="btn btn-primary" disabled={!!error} onClick={next}>
            {step.nextLabel ?? "Next"} →
          </button>
        </div>
      </div>
    </div>
  );
}
