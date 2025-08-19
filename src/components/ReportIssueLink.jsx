import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function ReportIssueLink({ context = "App", extra = {} }) {
  const { t } = useTranslation("common");
  const email = import.meta.env.VITE_SUPPORT_EMAIL || "dev@breadcalculator.online";

  const href = useMemo(() => {
    const here = typeof window !== "undefined" ? window.location.href : "";
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const subject = `Issue on ${context}`;
    const payload = {
      url: here,
      userAgent: ua,
      ...extra,
      notes: "Describe what happened and what you expected:"
    };
    const body = Object.entries(payload)
      .map(([k, v]) => `${k}: ${v ?? ""}`)
      .join("\n");
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [context, extra, email]);

  return (
    <a
      href={href}
      className="text-xs text-gray-500 hover:text-gray-700 underline dark:text-gray-400 dark:hover:text-gray-200"
    >
      {t("report_issue", "Report an issue")}
    </a>
  );
}
