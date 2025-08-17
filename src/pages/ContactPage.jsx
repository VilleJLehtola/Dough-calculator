import SEO from '@/components/SEO';

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO
        title="Contact • Taikinalaskin"
        description="Get in touch."
        canonical="https://www.breadcalculator.online/contact"
      />
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Send feedback or report a bug:
      </p>
      <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
        <li>Email: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="mailto:ville.j.lehtola@gmail.com">ville.j.lehtola@gmail.com</a></li>
        <li>Or open an issue in the repository if you prefer.</li>
      </ul>
    </div>
  );
}
