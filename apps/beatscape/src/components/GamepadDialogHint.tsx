type Props = {
  backLabel?: string;
};

/** Visible input legend shared by in-run controller dialogs. */
export function GamepadDialogHint({ backLabel = "Back" }: Props) {
  return (
    <div
      className="gamepad-dialog-hint"
      role="note"
      aria-label={`Controller dialog controls. Use the D-pad or left stick to move, bottom face to select, and right face to ${backLabel.toLowerCase()}.`}
    >
      <span>Controller</span>
      <strong>D-pad / stick · Move</strong>
      <strong>Face down · Select</strong>
      <strong>Face right · {backLabel}</strong>
    </div>
  );
}
