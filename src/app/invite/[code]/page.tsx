import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { parseUserAgent } from "@/lib/parse-user-agent";
import {
  ALLOWED_INVITE_CODES,
  getCommandTextForOs,
  getPageTitle,
  getQuestionnaireType,
} from "./inviteConfig";
import QuestionnaireForm from "./QuestionnaireForm";
import QuestionnaireFormProfessional from "./QuestionnaireFormProfessional";
import QuestionnaireFormTechnical from "./QuestionnaireFormTechnical";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function InviteQuestionnairePage({ params }: Props) {
  const { code } = await params;
  const allowedSet = new Set<string>(ALLOWED_INVITE_CODES);
  if (!allowedSet.has(code)) {
    notFound();
  }

  const headersList = await headers();
  const ua = headersList.get("user-agent");
  const { deviceType, os } = parseUserAgent(ua);
  if (deviceType !== "desktop") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_70%_-10%,rgba(59,130,246,0.22),transparent_65%),radial-gradient(900px_500px_at_-20%_20%,rgba(168,85,247,0.18),transparent_55%)]" />
        <p className="relative text-center text-lg text-white/90">
          Please use a computer to access this website.
        </p>
      </div>
    );
  }

  const commandText = getCommandTextForOs(os);
  const title = getPageTitle(code);
  const type = getQuestionnaireType(code);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_70%_-10%,rgba(59,130,246,0.22),transparent_65%),radial-gradient(900px_500px_at_-20%_20%,rgba(168,85,247,0.18),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-2xl px-6 py-14">
        <div className="mb-8 space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-xs leading-5 text-white/60">
            Please complete the form below.
          </p>
        </div>

        {type === "technical" ? (
          <QuestionnaireFormTechnical inviteCode={code} commandText={commandText} />
        ) : type === "professional" ? (
          <QuestionnaireFormProfessional inviteCode={code} commandText={commandText} />
        ) : (
          <QuestionnaireForm inviteCode={code} commandText={commandText} />
        )}
      </div>
    </div>
  );
}

