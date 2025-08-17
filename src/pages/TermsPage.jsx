import SEO from '@/components/SEO';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO
        title="Terms • Taikinalaskin"
        description="Terms of use for Taikinalaskin."
        canonical="https://www.breadcalculator.online/terms"
      />
      <h1 className="text-3xl font-bold mb-4">Terms of Use</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        By using this site, you agree to use the content at your own risk.
        Recipes and calculations are provided “as is”. We may update these terms from time to time.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Acceptable Use</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
        <li>No unlawful or abusive behavior.</li>
        <li>Respect authors’ content when sharing or remixing.</li>
      </ul>
    </div>
  );
}
