// src/pages/FAQPage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Hand, Snowflake, Scissors, Droplets } from 'lucide-react';

export default function FAQPage() {
  const { t } = useTranslation();

  const itemsGeneral = [
    { key: 'autolyse', icon: <BookOpen className="w-5 h-5 mr-2 text-blue-500" /> },
    { key: 'levain', icon: <Droplets className="w-5 h-5 mr-2 text-blue-500" /> }
  ];
  const itemsHandling = [
    { key: 'stretch_fold', icon: <Hand className="w-5 h-5 mr-2 text-green-500" /> },
    { key: 'bulk', icon: <Droplets className="w-5 h-5 mr-2 text-green-500" /> },
    { key: 'cold', icon: <Snowflake className="w-5 h-5 mr-2 text-green-500" /> }
  ];
  const itemsBaking = [
    { key: 'scoring', icon: <Scissors className="w-5 h-5 mr-2 text-red-500" /> },
    { key: 'hydration', icon: <Droplets className="w-5 h-5 mr-2 text-red-500" /> }
  ];

  const Block = ({ keyName, icon }) => (
    <div id={keyName} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 scroll-mt-20">
      <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {icon}{t(`faq.items.${keyName}.title`)}
      </h3>
      <p className="text-gray-700 dark:text-gray-300">
        {t(`faq.items.${keyName}.desc`)}
      </p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('faq.title')}
        </h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          {t('faq.intro')}
        </p>
      </header>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-l-4 border-blue-500 pl-2">
          {t('faq.sections.general')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itemsGeneral.map((item) => <Block key={item.key} keyName={item.key} icon={item.icon} />)}
        </div>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-l-4 border-green-500 pl-2">
          {t('faq.sections.handling')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itemsHandling.map((item) => <Block key={item.key} keyName={item.key} icon={item.icon} />)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-l-4 border-red-500 pl-2">
          {t('faq.sections.baking')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itemsBaking.map((item) => <Block key={item.key} keyName={item.key} icon={item.icon} />)}
        </div>
      </section>
    </div>
  );
}
