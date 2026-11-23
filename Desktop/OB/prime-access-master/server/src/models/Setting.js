const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    // Business identity
    brandName: { type: String, default: 'Prime Access' },
    tagline: { type: String, default: 'Immigration Consultancy Firm' },
    heroTitle: { type: String, default: 'Your Journey to the UK Starts Here' },
    heroSubtitle: {
      type: String,
      default:
        'Trusted immigration consultancy supporting UK visas, study placements and global travel with expert guidance from Zimbabwe.',
    },
    announcement: { type: String, default: '' }, // banner shown on top of the site
    announcementEnabled: { type: Boolean, default: false },

    // Contact details
    phone: { type: String, default: '+263772401643' },
    phoneDisplay: { type: String, default: '+263772401643' },
    whatsappNumber: { type: String, default: '447829841469' },
    email: { type: String, default: '' }, // no public email address - contact via WhatsApp / phone
    address: { type: String, default: 'Harare, Zimbabwe' },
    facebookUrl: { type: String, default: 'https://www.facebook.com/' },
    mapEmbedUrl: { type: String, default: '' },

    // Business hours (editable from the backend)
    businessHours: {
      type: [
        {
          day: { type: String, required: true },
          hours: { type: String, required: true },
        },
      ],
      default: [
        { day: 'Monday', hours: '8:00 AM - 5:00 PM' },
        { day: 'Tuesday', hours: '8:00 AM - 5:00 PM' },
        { day: 'Wednesday', hours: '8:00 AM - 5:00 PM' },
        { day: 'Thursday', hours: '8:00 AM - 5:00 PM' },
        { day: 'Friday', hours: '8:00 AM - 5:00 PM' },
        { day: 'Saturday', hours: 'Closed' },
        { day: 'Sunday', hours: 'Closed' },
      ],
    },

    // Homepage content
    aboutIntro: {
      type: String,
      default:
        'Prime Access Immigration Consultancy Firm is a professional immigration advisory firm based in Zimbabwe, dedicated to helping individuals and families achieve their international goals with honesty, transparency and expert guidance.',
    },
    testimonials: [
      {
        name: String,
        location: String,
        text: String,
        rating: { type: Number, default: 5, min: 1, max: 5 },
      },
    ],

    // SEO
    seoTitle: { type: String, default: 'Prime Access - Immigration Consultancy Firm Zimbabwe' },
    seoDescription: {
      type: String,
      default:
        'UK visa, student visa, business visa and immigration support from Prime Access Immigration Consultancy Firm. Book a consultation or chat on WhatsApp today.',
    },

    // Videos shown on the homepage (admin-managed)
    videos: [
      {
        title: String,
        url: String, // YouTube/Vimeo embed URL or uploaded /uploads/... path
        published: { type: Boolean, default: true },
      },
    ],

    // Announcement
    updatedBy: String,
  },
  { timestamps: true }
);

// There is a single settings document
settingSchema.statics.getSingleton = async function () {
  let s = await this.findOne();
  if (!s) s = await this.create({});
  return s;
};

module.exports = mongoose.model('Setting', settingSchema);