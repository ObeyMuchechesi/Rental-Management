import { useSettings } from '../SettingsContext';
import { waLink } from '../api';

export default function Terms() {
  const { settings } = useSettings();
  const brand = settings?.brandName || 'Prime Access Immigration Consultancy Firm';
  const phone = settings?.phone || '+263772401643';
  const waHref = waLink(settings?.whatsappNumber, 'Hi Prime Access, I have a question about your terms & conditions.');

  return (
    <section className="py-16">
      <div className="container-x max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-600">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-brand-950">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-brand-600">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-brand-800">
          <h2 className="font-display text-xl font-semibold text-brand-950">1. Introduction</h2>
          <p>
            These terms govern your use of the {brand} website and services. By using this website or submitting an inquiry,
            you agree to these terms.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">2. Nature of Our Services</h2>
          <p>
            {brand} provides immigration consultancy and application-guidance services. We assist with preparing and reviewing
            visa applications, but final decisions are made solely by immigration authorities (such as the UK Home Office).
            We cannot guarantee the outcome of any application.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">3. Consultancy Fees</h2>
          <p>
            Our consultancy fees, if any, will be clearly communicated to you before you engage our services. Government
            visa fees are paid directly to the relevant authority and are separate from any consultancy charges.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">4. Your Responsibilities</h2>
          <p>
            You agree to provide accurate and truthful information. Submitting false documents or information to immigration
            authorities is illegal and may lead to refusal, bans or prosecution - we do not assist with or condone this in any way.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">5. Website Use</h2>
          <p>
            Content on this website is provided for general information and does not constitute legal advice. You may not
            misuse the website, attempt to access restricted areas, or interfere with its operation.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">6. Liability</h2>
          <p>
            To the fullest extent permitted by law, {brand} is not liable for any indirect or consequential loss arising
            from your use of the website or our guidance, including refusals by immigration authorities.
          </p>
          <h2 className="font-display text-xl font-semibold text-brand-950">7. Changes to These Terms</h2>
          <p>We may update these terms from time to time. Continued use of the website after changes means you accept the updated terms.</p>
          <h2 className="font-display text-xl font-semibold text-brand-950">8. Contact</h2>
          <p>
            Questions about these terms?{' '}
            <a className="font-semibold text-brand-900 underline" href={waHref} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>
            {' '}or call {phone}.
          </p>
        </div>
      </div>
    </section>
  );
}