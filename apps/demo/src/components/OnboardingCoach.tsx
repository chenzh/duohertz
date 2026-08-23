import { useEffect, useState } from "react";
import type { LandingContent } from "../content/landing";

const KEY = "demo_onboarding_done";

export function OnboardingCoach({ content }: { content: LandingContent }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;
  const current = content.onboardingSteps[step];
  if (!current) return null;

  function finish() {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  }

  return (
    <div className="onboarding-coach glass" data-testid="onboarding-coach">
      <p>
        <strong>{current.title}</strong> — {current.body}
      </p>
      <div className="onboarding-actions">
        <button type="button" className="btn-ghost" onClick={finish}>
          跳过
        </button>
        {step < content.onboardingSteps.length - 1 ? (
          <button type="button" className="btn-secondary" onClick={() => setStep(step + 1)}>
            下一步
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={finish}>
            开始
          </button>
        )}
      </div>
    </div>
  );
}
