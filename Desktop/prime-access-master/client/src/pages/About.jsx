import { Target, HeartHandshake, ShieldCheck, Eye, Users, Compass, Award } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import SectionHeading from '../components/SectionHeading';
import logoFull from '../assets/logo-full.png';
import manImg from '../assets/man-passport.jpg';
import indiaImg from '../assets/india-journeys.jpg';
import CTASection from '../components/CTASection';
import { Link } from 'react-router-dom';

export default function About() {
  const { settings } = useSettings();
  if (!settings) return null;

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 py-16 lg:py-20">
        {/* Full-bleed photo backdrop, veiled so the copy stays readable */}
        <img
          src={manImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%] sm:object-[55%_15%]"
        />
        <div className="absolute inset-0 bg-brand-950/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/75 to-brand-950/35" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-brand-950/95 to-transparent" />
        <div className="container-x relative text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">About Us</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">The People Behind {settings.brandName}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-300">{settings.aboutIntro}</p>
          <img src={logoFull} alt="Prime Access logo" className="mx-auto mt-10 w-64 max-w-full sm:w-80" />
        </div>
      </section>

      <section className="py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our Story"
              title="Professional, Honest and Committed to Your Success"
              subtitle="Prime Access Immigration Consultancy Firm was founded on a simple belief: everyone deserves clear, honest guidance when navigating the complex world of visas and immigration. Based in Zimbabwe, we help individuals, families and businesses reach the UK, Europe and beyond."
            />
            <div className="mt-8 space-y-4">
              {[
                { icon: Eye, title: 'Our Mission', text: 'To make international travel, study and work accessible by providing accurate, up-to-date immigration advice with a personal touch.' },
                { icon: HeartHandshake, title: 'Our Approach', text: 'We listen first. Every application is unique, so we take the time to understand your situation before recommending the right path.' },
                { icon: Award, title: 'Our Commitment', text: 'Transparent guidance, honest eligibility assessments and full support from first inquiry to final decision.' },
              ].map((v) => (
                <div key={v.title} className="flex gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-gold-400"><v.icon size={20} /></span>
                  <div>
                    <h3 className="font-semibold text-brand-950">{v.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-brand-700">{v.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-900"><Users size={14} /> Our Values</p>
            <ul className="mt-6 space-y-4">
              {[
                { icon: ShieldCheck, t: 'Integrity', d: 'We give honest advice - including when the answer is “not yet” - because your trust matters more than a sale.' },
                { icon: Compass, t: 'Guidance', d: 'We walk every step of the application with you, so you never feel lost in the process.' },
                { icon: Target, t: 'Results', d: 'We prepare every application meticulously, giving you the best possible chance of success.' },
              ].map((v) => (
                <li key={v.t} className="flex gap-3">
                  <v.icon size={20} className="mt-1 shrink-0 text-gold-600" />
                  <div>
                    <h4 className="font-semibold text-brand-950">{v.t}</h4>
                    <p className="mt-0.5 text-sm text-brand-700">{v.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/contact" className="btn-primary mt-8 w-full">Book a Consultation</Link>
          </div>
        </div>
      </section>

      <div className="container-x pb-20 lg:pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          <img
            src={manImg}
            alt="A happy Prime Access client holding his passport and boarding passes"
            loading="lazy"
            className="h-80 w-full rounded-[2rem] border border-brand-100 object-cover object-top shadow-card sm:h-[26rem]"
          />
          <img
            src={indiaImg}
            alt="Exploring the world - journeys across India's landmarks"
            loading="lazy"
            className="h-80 w-full rounded-[2rem] border border-brand-100 object-cover object-center shadow-card sm:h-[26rem]"
          />
        </div>
      </div>

      <CTASection
        title="Let's Talk About Your Plans"
        subtitle="Whether you are just exploring options or ready to apply, we are here to help."
      />
    </>
  );
}