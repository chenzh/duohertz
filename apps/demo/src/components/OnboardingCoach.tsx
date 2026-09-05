import { useEffect, useState } from "react";
import type { LandingContent } from "../content/landing";
import type { Locale } from "../i18n";
import { readStorage, writeStorage } from "../lib/storage";

const KEY = "demo_onboarding_done";

export function OnboardingCoach({ content, locale = "zh" }: { content: LandingContent; locale?: Locale }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readStorage(KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;
  const current = content.onboardingSteps[step];
  if (!current) return null;

  function finish() {
    writeStorage(KEY, "1");
    setVisible(false);
  }

  return (
    <div className="onboarding-coach glass" data-testid="onboarding-coach">
      <p>
        <strong>{current.title}</strong> — {current.body}
      </p>
      <div className="onboarding-actions">
        <button type="button" className="btn-ghost" onClick={finish}>
          {locale === "zh" ? "跳过" : "Skip"}
        </button>
        {step < content.onboardingSteps.length - 1 ? (
          <button type="button" className="btn-secondary" onClick={() => setStep(step + 1)}>
            {locale === "zh" ? "下一步" : "Next"}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={finish}>
            {locale === "zh" ? "开始" : "Start"}
          </button>
        )}
      </div>
    </div>
  );
}
