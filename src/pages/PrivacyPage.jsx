import SEO from '@/components/SEO';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO
        title="Privacy • Taikinalaskin"
        description="How we handle data and analytics."
        canonical="https://www.breadcalculator.online/privacy"
      />
      <h1 className="text-3xl font-bold mb-4">Privacy</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        We use <strong>Plausible Analytics</strong> (a privacy-friendly, cookieless analytics tool).
        We do not collect or store personal data for advertising. Anonymous usage events
        help us improve features like the calculator and recipe browsing.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">What we collect</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
        <li>Aggregate page views and events (e.g., “Calculator Used”, “Recipe Viewed”).</li>
        <li>No cookies, no cross-site tracking, no personal identifiers.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
      <p className="text-gray-700 dark:text-gray-300">
        Questions? Email us via the Contact page.
      </p>
    </div>
  );
}
