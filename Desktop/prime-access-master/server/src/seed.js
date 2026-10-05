require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { connectDB } = require('./db');
const Admin = require('./models/Admin');
const Service = require('./models/Service');
const Setting = require('./models/Setting');
const Media = require('./models/Media');
const { migrateContactSettings } = require('./lib/migrateContactSettings');

const DEFAULT_SERVICES = [
  {
    title: 'UK Visa & Immigration Support',
    slug: 'uk-visa-immigration',
    icon: 'passport',
    shortDescription: 'End-to-end support for UK visit, work and settlement visa applications with document checking and guidance.',
    description:
      'Our flagship service covers the full UK visa journey: eligibility assessment, application preparation, document verification, financial evidence guidance and submission support. We help you avoid the common mistakes that lead to refusals.',
    features: ['Eligibility assessment', 'Application preparation', 'Document checking', 'Financial evidence guidance', 'Submission support'],
    whatsappMessage: 'Hi Prime Access, I need help with a UK visa application.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Big_Ben%2C_London%2C_United_Kingdom_%28Unsplash_p8cUip6Tlwg%29.jpg/1920px-Big_Ben%2C_London%2C_United_Kingdom_%28Unsplash_p8cUip6Tlwg%29.jpg',    popular: true,
  },
  {
    title: 'Visit Visas',
    slug: 'visit-visas',
    icon: 'plane',
    shortDescription: 'Guidance for short-stay visitor visas to the UK, Schengen area and other destinations.',
    description:
      'Planning a holiday, family visit or business trip? We guide you through visitor visa requirements, sponsorship letters, travel itineraries and supporting documents.',
    features: ['Visitor visa guidance', 'Itinerary & invitation support', 'Financial evidence help', 'Application review'],
    whatsappMessage: 'Hi Prime Access, I need help with a visit visa.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Bright_skies_seen_from_a_plane_%28Unsplash%29.jpg/1920px-Bright_skies_seen_from_a_plane_%28Unsplash%29.jpg',    popular: true,
  },
  {
    title: 'Student Visas',
    slug: 'student-visas',
    icon: 'graduation',
    shortDescription: 'Student visa support for the UK and abroad, including CAS, financial evidence and interview preparation.',
    description:
      'From choosing a course to securing your CAS and visa, our student visa service walks you through every step, including financial evidence and credibility interview preparation.',
    features: ['Course & CAS guidance', 'Financial evidence support', 'Interview preparation', 'Tier 4 / Student route help'],
    whatsappMessage: 'Hi Prime Access, I need help with a student visa.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/University_of_Oxford_Clarendon_Building.jpg/1920px-University_of_Oxford_Clarendon_Building.jpg',    popular: true,
  },
  {
    title: 'Business Visas',
    slug: 'business-visas',
    icon: 'briefcase',
    shortDescription: 'Support for business visitor visas, investor routes and entrepreneur pathways.',
    description:
      'Whether you are attending meetings, exploring investment or looking to establish a business, we provide specialist guidance for business-related visa routes.',
    features: ['Business visitor visas', 'Investor route advice', 'Entrepreneur pathways', 'Company documentation help'],
    whatsappMessage: 'Hi Prime Access, I need help with a business visa.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Milan_skyline_skyscrapers_of_Porta_Nuova_business_district.jpg/1920px-Milan_skyline_skyscrapers_of_Porta_Nuova_business_district.jpg',  },
  {
    title: 'Schengen Assistance',
    slug: 'schengen-assistance',
    icon: 'globe',
    shortDescription: 'Complete Schengen visa assistance for travel across the 27 Schengen member states.',
    description:
      'Travel to Europe with confidence. We help with Schengen visa applications including travel insurance, itineraries and embassy appointment preparation.',
    features: ['Schengen application help', 'Travel insurance guidance', 'Itinerary planning', 'Embassy appointment prep'],
    whatsappMessage: 'Hi Prime Access, I need help with a Schengen visa.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Sous_la_Tour_Eiffel_1.jpg/1920px-Sous_la_Tour_Eiffel_1.jpg',  },
  {
    title: 'University Placement',
    slug: 'university-placement',
    icon: 'school',
    shortDescription: 'University applications and placement support for students targeting UK institutions.',
    description:
      'From UCAS applications to offer acceptance and pre-departure preparation, we connect you with the right university and guide you through the entire admissions process.',
    features: ['UCAS application support', 'Course & university matching', 'Offer acceptance guidance', 'Pre-departure preparation'],
    whatsappMessage: 'Hi Prime Access, I need help with university placement.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/University_graduation_%28Unsplash%29.jpg/1920px-University_graduation_%28Unsplash%29.jpg',  },
  {
    title: 'eVisa Account Creation',
    slug: 'evisa-account-creation',
    icon: 'id',
    shortDescription: 'Hands-on help creating and managing your UK eVisa account.',
    description:
      'We assist with UKVI account creation, linking your passport and BRP, and understanding your eVisa so your immigration status is always verifiable online.',
    features: ['UKVI account setup', 'Passport & BRP linking', 'eVisa explanation', 'Access troubleshooting'],
    whatsappMessage: 'Hi Prime Access, I need help setting up my eVisa account.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Man_typing_on_laptop_%28Unsplash%29.jpg/1920px-Man_typing_on_laptop_%28Unsplash%29.jpg',  },
  {
    title: 'Refusal Letter Guidance',
    slug: 'refusal-letter-guidance',
    icon: 'shield',
    shortDescription: 'Expert review of visa refusal letters and advice on your options, including reconsideration or reapplication.',
    description:
      'A refusal is not the end of the road. We review your refusal letter, explain the grounds, and advise on the strongest path forward - whether administrative review, appeal or reapplication.',
    features: ['Refusal letter review', 'Grounds explanation', 'Reapplication strategy', 'Appeal / review advice'],
    whatsappMessage: 'Hi Prime Access, I received a refusal letter and need guidance.',

    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Coffee%2C_notebooks_and_pen_%28Unsplash%29.jpg/1920px-Coffee%2C_notebooks_and_pen_%28Unsplash%29.jpg',  },
];

async function run() {
  await connectDB();

  // Admin
  if ((await Admin.countDocuments()) === 0) {
    const email = (process.env.ADMIN_EMAIL || 'admin@primeaccess.co.zw').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    await Admin.create({ name: 'Prime Access Admin', email, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`[seed] admin created: ${email} / ${password}`);
  } else {
    console.log('[seed] admin already exists - skipped');
  }

  // Services
  if ((await Service.countDocuments()) === 0) {
    await Service.insertMany(DEFAULT_SERVICES);
    console.log(`[seed] ${DEFAULT_SERVICES.length} services created`);
  } else {
    console.log('[seed] services already exist - skipped');
  }

  // Settings singleton
  await Setting.getSingleton();
  console.log('[seed] settings initialised');

  // Refresh any legacy contact details (old phone / WhatsApp / address)
  await migrateContactSettings();

  // Sample media note
  if ((await Media.countDocuments()) === 0) {
    console.log('[seed] no media yet - upload via the admin dashboard (Media)');
  }

  await mongoose.disconnect();
  console.log('[seed] done.');
}

run().catch((e) => {
  console.error('[seed] failed:', e);
  process.exit(1);
});