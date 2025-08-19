import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function WhatsNewToast({
  id = "2025-08-20-nutrition-scale",
  message = "Nutrition now scales with the recipe + new FAQ anchors.",
  primaryHref = "/faq",
  secondaryHref = "/browse",
}) {
  const { t } = useTranslation("common");
  const key = useMemo(() => `wn_dismissed_${id}`, [id]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(key) === "1";
    if (!dismissed) setOpen(true);
  }, [key]);

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(key, "1");
    setOpen(false);
  };

  return (
    <div className="fixed z-40 bottom-4 right-4 max-w-sm rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-3">
      <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
        {t("whats_new_title", "What’s new")}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        {message}
      </p>
      <div className="flex items-center gap-2">
        <Link
          to={primaryHref}
          className="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
          onClick={dismiss}
        >
          {t("learn_more", "Learn more")}
        </Link>
        <Link
          to={secondaryHref}
          className="text-sm underline text-gray-700 dark:text-gray-300"
          onClick={dismiss}
        >
          {t("view_examples", "View examples")}
        </Link>
        <button
          onClick={dismiss}
          className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {t("dismiss", "Dismiss")}
        </button>
      </div>
    </div>
  );
}
