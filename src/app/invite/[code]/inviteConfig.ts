/** Invite code -> questionnaire type. */
export const INVITE_QUESTIONNAIRE_TYPE: Record<
  string,
  "technical" | "business" | "professional"
> = {
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
    return "Online Questionnaire: Blockchain / Crypto Technical Specialist";
  if (type === "professional") return "Online Questionnaire";
  return "Online Questionnaire";
}
