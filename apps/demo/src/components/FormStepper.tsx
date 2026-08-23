import type { Messages } from "../i18n";

type Step = 1 | 2 | 3;

export function FormStepper({
  step,
  setStep,
  t,
  advanced,
  setAdvanced,
}: {
  step: Step;
  setStep: (s: Step) => void;
  t: Messages;
  advanced: boolean;
  setAdvanced: (v: boolean) => void;
}) {
  const labels = [t.stepScene, t.stepParams, t.stepConfirm];
  return (
    <div className="form-stepper" data-testid="form-stepper">
      <div className="stepper-track">
        {labels.map((label, i) => {
          const n = (i + 1) as Step;
          return (
            <button
              key={label}
              type="button"
              className={step === n ? "active" : step > n ? "done" : ""}
              onClick={() => setStep(n)}
            >
              <span className="step-num">{n}</span>
              {label}
            </button>
          );
        })}
      </div>
      <button type="button" className="btn-ghost stepper-advanced" onClick={() => setAdvanced(!advanced)}>
        {advanced ? t.stepAdvancedHide : t.stepAdvancedShow}
      </button>
    </div>
  );
}
