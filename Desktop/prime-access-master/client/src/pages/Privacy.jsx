import { useSettings } from '../SettingsContext';
import { waLink } from '../api';

export default function Privacy() {
  const { settings } = useSettings();
  const brand = settings?.brandName || 'Prime Access Immigration Consultancy Firm';
  const phone = settings?.phone || '+263772401643';
  const waHref = waLink(settings?.whatsappNumber, 'Hi Prime Access, I have a question about your privacy policy.');

  return (
    <section className="py-16">
      <div className="container-x max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-600">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-brand-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-brand-600">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-brand mt-8 space-y-6 text-sm leading-relaxed text-brand-800">
          <p>
            {brand} ("we", "us") respects your privacy. This policy explains what information we collect through this website,
            how we use it, and the choices you have.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">1. Information We Collect</h2>
          <p>
            When you submit an inquiry through our website we collect your name, phone/WhatsApp number, email address,
            destination, the service you are interested in, and any message you choose to share. We also collect basic,
            anonymised analytics data (pages visited, clicks on WhatsApp/call buttons) to improve our website.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">2. How We Use Your Information</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To respond to your inquiry and provide the consultancy services you request.</li>
            <li>To send you confirmations and updates related to your inquiry.</li>
            <li>To improve our website, services and customer experience.</li>
          </ul>
          <h2 className="font-display text-xl font-semibold text-brand-950">3. WhatsApp & Communication</h2>
          <p>
            When you contact us via WhatsApp, your conversation is subject to WhatsApp's own privacy policy. We may use
            your WhatsApp number to respond to your inquiry and, with your consent, to send relevant updates about your application.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">4. Data Sharing</h2>
          <p>
            We do not sell your personal information. We only share data where required by law or with service providers
            (such as email or hosting providers) who help us operate this website under strict confidentiality.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">5. Data Security</h2>
          <p>
            We use HTTPS encryption, secure administrative access and reasonable technical measures to protect your data.
            No method of transmission over the internet is 100% secure, but we work hard to safeguard your information.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">6. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal information at any time by contacting us on WhatsApp or by phone.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">7. Contact</h2>
          <p>
            Questions about this policy?{' '}
            <a className="font-semibold text-brand-900 underline" href={waHref} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>
            {' '}or call {phone}.
          </p>
        </div>
      </div>
    </section>
  );
}