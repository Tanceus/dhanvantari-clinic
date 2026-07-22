import { useClinicConfig } from "../config/ClinicConfigProvider";

interface EmailPreviewProps {
  toName: string;
  toEmail: string;
  subject: string;
  body: string;
}

export function EmailPreview({
  toName,
  toEmail,
  subject,
  body,
}: EmailPreviewProps) {
  const { config } = useClinicConfig();

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-bg-surface shadow-soft">
      <header className="border-b border-line bg-bg-base/60 px-5 py-4 sm:px-6">
        <dl className="space-y-3 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-14 shrink-0 font-medium text-text-muted">From</dt>
            <dd className="min-w-0 break-words">
              <span className="font-medium text-text-primary">
                {config.name}
              </span>
              <span className="mx-1.5 text-text-muted/50">&lt;</span>
              <span className="break-all text-text-muted">{config.contact.email}</span>
              <p className="mt-0.5 text-xs text-text-muted/70">
                Send-as clinic identity
              </p>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-14 shrink-0 font-medium text-text-muted">To</dt>
            <dd className="min-w-0 break-words">
              <span className="font-medium text-text-primary">{toName}</span>
              <span className="mx-1.5 text-text-muted/50">&lt;</span>
              <span className="break-all text-text-muted">{toEmail}</span>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="w-14 shrink-0 font-medium text-text-muted">
              Subject
            </dt>
            <dd className="min-w-0 break-words font-display text-base font-semibold text-text-primary sm:text-lg">
              {subject}
            </dd>
          </div>
        </dl>
      </header>
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="break-words whitespace-pre-wrap text-sm leading-relaxed text-text-primary sm:text-[15px] sm:leading-7">
          {body}
        </div>
      </div>
    </article>
  );
}
