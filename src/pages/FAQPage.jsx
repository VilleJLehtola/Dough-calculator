// src/pages/FAQPage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function FAQPage() {
  const { t } = useTranslation();

  const itemsGeneral = ['autolyse', 'levain'];
  const itemsHandling = ['stretch_fold', 'bulk', 'cold'];
  const itemsBaking = ['scoring', 'hydration'];

  const Block = ({ keyName }) => (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {t(`faq.items.${keyName}.title`)}
      </h3>
      <p className="text-gray-700 dark:text-gray-300">
        {t(`faq.items.${keyName}.desc`)}
      </p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('faq.title')}
        </h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          {t('faq.intro')}
        </p>
      </header>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('faq.sections.general')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itemsGeneral.map((k) => <Block key={k} keyName={k} />)}
        </div>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('faq.sections.handling')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itemsHandling.map((k) => <Block key={k} keyName={k} />)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('faq.sections.baking')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itemsBaking.map((k) => <Block key={k} keyName={k} />)}
        </div>
      </section>
    </div>
  );
}
