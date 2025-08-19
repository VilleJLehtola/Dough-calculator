// src/pages/FAQPage.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Hand,
  Snowflake,
  Scissors,
  Droplets,
  Info,
} from "lucide-react";

export default function FAQPage() {
  const { t } = useTranslation();

  // Section configs with icons + anchor ids
  const sections = [
    {
      id: "general",
      titleKey: "faq.sections.general",
      accent: "border-blue-500",
      items: [
        { key: "autolyse", Icon: BookOpen },
        { key: "levain", Icon: Droplets },
      ],
    },
    {
      id: "handling",
      titleKey: "faq.sections.handling",
      accent: "border-green-500",
      items: [
        { key: "stretch_fold", Icon: Hand },
        { key: "bulk", Icon: Droplets },
        { key: "cold", Icon: Snowflake },
      ],
    },
    {
      id: "baking",
      titleKey: "faq.sections.baking",
      accent: "border-red-500",
      items: [
        { key: "scoring", Icon: Scissors },
        { key: "hydration", Icon: Droplets },
      ],
    },
  ];

  const Card = ({ keyName, Icon }) => (
    <div
      id={keyName}
      className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 scroll-mt-24"
    >
      <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white mb-1">
        <Icon className="w-5 h-5 mr-2" />
        {t(`faq.items.${keyName}.title`)}
      </h3>
      <p className="text-gray-700 dark:text-gray-300">
        {t(`faq.items.${keyName}.desc`)}
      </p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t("faq.title")}
        </h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">{t("faq.intro")}</p>
      </header>

      {/* On this page (anchors) */}
      <nav
        aria-label="On this page"
        className="mb-8 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 p-4"
      >
        <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-3">
          <Info className="w-4 h-4 mr-2" />
          On this page
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {sections.flatMap((s) =>
            s.items.map((it) => (
              <a
                key={it.key}
                href={`#${it.key}`}
                className="underline text-blue-700 dark:text-blue-300 hover:opacity-80"
              >
                {t(`faq.items.${it.key}.title`)}
              </a>
            ))
          )}
        </div>
      </nav>

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.id} className="space-y-4 mb-10">
          <h2
            id={section.id}
            className={`text-xl font-semibold text-gray-900 dark:text-white border-l-4 ${section.accent} pl-2`}
          >
            {t(section.titleKey)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map(({ key, Icon }) => (
              <Card key={key} keyName={key} Icon={Icon} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
