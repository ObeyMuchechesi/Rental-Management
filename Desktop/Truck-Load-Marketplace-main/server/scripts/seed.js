/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Company = require('../models/Company');
const Truck = require('../models/Truck');
const Load = require('../models/Load');
const Subscription = require('../models/Subscription');
const Unlock = require('../models/Unlock');

const CITIES = {
  Nairobi: [36.8219, -1.2921],
  Mombasa: [39.6682, -4.0435],
  Kisumu: [34.7617, -0.0917],
  Nakuru: [36.08, -0.3031],
  Eldoret: [35.2698, 0.5143],
  Thika: [37.0693, -1.0333],
  Kampala: [32.5825, 0.3476],
  'Dar es Salaam': [39.2083, -6.7924],
};

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const upsertCompany = (data) =>
  Company.findOneAndUpdate({ name: data.name }, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });

const upsertUser = async (email, data) => {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return User.findOneAndUpdate(
    { email },
    { $set: { ...data, email, passwordHash } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('company');
};

const upsertTruck = (company, plateNumber, data) =>
  Truck.findOneAndUpdate(
    { company: company._id, plateNumber },
    {
      $set: {
        ...data,
        company: company._id,
        plateNumber,
        currentLocation: {
          city: data.city,
          coordinates: CITIES[data.city],
        },
        geo: { type: 'Point', coordinates: CITIES[data.city] },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const upsertLoad = (company, key, data) =>
  Load.findOneAndUpdate(
    { company: company._id, cargoType: key },
    {
      $set: {
        ...data,
        company: company._id,
        cargoType: key,
        pickup: { city: data.from, coordinates: CITIES[data.from], date: data.pickupDate },
        dropoff: { city: data.to, coordinates: CITIES[data.to], date: data.dropoffDate },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  await Promise.all([
    User.syncIndexes(),
    Company.syncIndexes(),
    Truck.syncIndexes(),
    Load.syncIndexes(),
    Subscription.syncIndexes(),
    Unlock.syncIndexes(),
  ]);

  const kilimanjaro = await upsertCompany({
    name: 'Kilimanjaro Logistics',
    type: 'carrier',
    phone: '+254712000101',
    address: 'Industrial Area, Nairobi',
    taxId: 'KE-CAR-001',
    verified: true,
    rating: 4.7,
  });

  const riftValley = await upsertCompany({
    name: 'Rift Valley Tankers',
    type: 'carrier',
    phone: '+254712000202',
    address: 'Eldoret Industrial Park',
    taxId: 'KE-CAR-002',
    verified: true,
    rating: 4.4,
  });

  const lakeview = await upsertCompany({
    name: 'Lakeview Haulage',
    type: 'carrier',
    phone: '+254712000303',
    address: 'Kisumu Port Road',
    taxId: 'KE-CAR-003',
    verified: false,
    rating: 0,
  });

  const savannah = await upsertCompany({
    name: 'Savannah Freight',
    type: 'shipper',
    phone: '+254733000404',
    address: 'Mombasa Road, Nairobi',
    taxId: 'KE-SHP-004',
    verified: true,
    rating: 4.8,
  });

  const coast = await upsertCompany({
    name: 'Coast Traders',
    type: 'shipper',
    phone: '+254733000505',
    address: 'Changamwe, Mombasa',
    taxId: 'KE-SHP-005',
    verified: true,
    rating: 4.6,
  });

  const admin = await upsertUser('admin@trucklink.test', {
    name: 'Amina Yusuf',
    password: 'Admin@12345',
    role: 'admin',
  });

  const carrierUser = await upsertUser('ops@kilimanjaro.test', {
    name: 'Peter Mwangi',
    password: 'Carrier@123',
    role: 'carrier',
    company: kilimanjaro._id,
  });

  const tankerUser = await upsertUser('dispatch@riftvalley.test', {
    name: 'Grace Chebet',
    password: 'Carrier@123',
    role: 'carrier',
    company: riftValley._id,
  });

  await upsertUser('ops@lakeview.test', {
    name: 'Otieno Odhiambo',
    password: 'Carrier@123',
    role: 'carrier',
    company: lakeview._id,
  });

  const shipperUser = await upsertUser('dispatch@savannah.test', {
    name: 'Njeri Kamau',
    password: 'Shipper@123',
    role: 'shipper',
    company: savannah._id,
  });

  const coastUser = await upsertUser('ops@coasttraders.test', {
    name: 'Hassan Ali',
    password: 'Shipper@123',
    role: 'shipper',
    company: coast._id,
  });

  await Subscription.findOneAndUpdate(
    { company: kilimanjaro._id },
    { $set: { plan: 'monthly', status: 'active', currentPeriodEnd: days(24) } },
    { upsert: true }
  );
  await Subscription.findOneAndUpdate(
    { company: riftValley._id },
    { $set: { plan: 'per_use', status: 'none', credits: 6 } },
    { upsert: true }
  );
  await Subscription.findOneAndUpdate(
    { company: lakeview._id },
    { $set: { plan: 'free', status: 'none', credits: 0 } },
    { upsert: true }
  );
  await Subscription.findOneAndUpdate(
    { company: savannah._id },
    { $set: { plan: 'per_use', status: 'none', credits: 5 } },
    { upsert: true }
  );
  await Subscription.findOneAndUpdate(
    { company: coast._id },
    { $set: { plan: 'monthly', status: 'active', currentPeriodEnd: days(12) } },
    { upsert: true }
  );

  const trucks = [
    await upsertTruck(kilimanjaro, 'KDG 412X', {
      type: 'flatbed',
      capacityTons: 30,
      capacityVolumeM3: 90,
      city: 'Nairobi',
      availableUntil: days(18),
      minRatePerKm: 1.2,
      contactPhone: '+254712000101',
      exactAddress: 'Plot 14, Enterprise Road, Industrial Area',
    }),
    await upsertTruck(kilimanjaro, 'KDE 887T', {
      type: 'refrigerated',
      capacityTons: 18,
      capacityVolumeM3: 60,
      city: 'Nairobi',
      availableUntil: days(9),
      minRatePerKm: 1.45,
      contactPhone: '+254712000101',
      exactAddress: 'Cold store 3, Mombasa Road',
    }),
    await upsertTruck(kilimanjaro, 'KDD 233K', {
      type: 'container',
      capacityTons: 28,
      capacityVolumeM3: 68,
      city: 'Mombasa',
      availableUntil: days(26),
      minRatePerKm: 1.1,
      contactPhone: '+254712000101',
      exactAddress: 'Berth 12 yard, Mombasa Port',
    }),
    await upsertTruck(riftValley, 'KCE 501P', {
      type: 'tanker',
      capacityTons: 32,
      capacityVolumeM3: 40,
      city: 'Mombasa',
      availableUntil: days(21),
      minRatePerKm: 1.35,
      contactPhone: '+254712000202',
      exactAddress: 'Tank farm gate 4, Changamwe',
    }),
    await upsertTruck(riftValley, 'KCF 720R', {
      type: 'tanker',
      capacityTons: 30,
      capacityVolumeM3: 36,
      city: 'Eldoret',
      availableUntil: days(14),
      minRatePerKm: 1.3,
      contactPhone: '+254712000202',
      exactAddress: 'Depot 2, Eldoret Industrial Park',
    }),
    await upsertTruck(riftValley, 'KCB 118M', {
      type: 'tipper',
      capacityTons: 26,
      capacityVolumeM3: 18,
      city: 'Nakuru',
      availableUntil: days(11),
      minRatePerKm: 1.05,
      contactPhone: '+254712000202',
      exactAddress: 'Quarry access road, Nakuru',
    }),
    await upsertTruck(lakeview, 'KCJ 640L', {
      type: 'box',
      capacityTons: 12,
      capacityVolumeM3: 45,
      city: 'Kisumu',
      availableUntil: days(16),
      minRatePerKm: 1.0,
      contactPhone: '+254712000303',
      exactAddress: 'Warehouse 7, Kisumu Port Road',
    }),
    await upsertTruck(kilimanjaro, 'KDL 905B', {
      type: 'lowbed',
      capacityTons: 40,
      capacityVolumeM3: 30,
      city: 'Thika',
      availableUntil: days(30),
      minRatePerKm: 1.75,
      contactPhone: '+254712000101',
      exactAddress: 'Heavy haul yard, Thika Road',
    }),
  ];

  await upsertLoad(savannah, 'Bagged cement', {
    weightTons: 28,
    truckTypesRequired: ['flatbed', 'container'],
    from: 'Nairobi',
    to: 'Mombasa',
    pickupDate: days(2),
    dropoffDate: days(3),
    offeredRatePerKm: 1.4,
    totalOfferedRate: 700,
    contactPhone: '+254733000404',
    status: 'open',
  });

  await upsertLoad(savannah, 'Fresh produce', {
    weightTons: 16,
    truckTypesRequired: ['refrigerated'],
    from: 'Nairobi',
    to: 'Kisumu',
    pickupDate: days(1),
    dropoffDate: days(2),
    offeredRatePerKm: 1.25,
    totalOfferedRate: 437,
    contactPhone: '+254733000404',
    status: 'open',
  });

  await upsertLoad(savannah, 'Steel coils', {
    weightTons: 22,
    truckTypesRequired: ['lowbed', 'flatbed'],
    from: 'Thika',
    to: 'Kampala',
    pickupDate: days(4),
    dropoffDate: days(6),
    offeredRatePerKm: 1.3,
    totalOfferedRate: 1430,
    contactPhone: '+254733000404',
    status: 'open',
  });

  await upsertLoad(coast, 'Diesel fuel', {
    weightTons: 30,
    truckTypesRequired: ['tanker'],
    from: 'Mombasa',
    to: 'Nairobi',
    pickupDate: days(3),
    dropoffDate: days(4),
    offeredRatePerKm: 1.5,
    totalOfferedRate: 750,
    contactPhone: '+254733000505',
    status: 'open',
  });

  await upsertLoad(coast, 'Fertiliser', {
    weightTons: 24,
    truckTypesRequired: ['tipper', 'container'],
    from: 'Dar es Salaam',
    to: 'Nairobi',
    pickupDate: days(6),
    dropoffDate: days(9),
    offeredRatePerKm: 1.6,
    totalOfferedRate: 2080,
    contactPhone: '+254733000505',
    status: 'open',
  });

  for (const truck of trucks.slice(0, 3)) {
    await Unlock.updateOne(
      { company: savannah._id, targetType: 'truck', targetId: truck._id },
      { $setOnInsert: { method: 'credit', amount: 1 } },
      { upsert: true }
    );
  }

  console.log('\nSeed complete. Demo accounts:');
  console.log('  admin    admin@trucklink.test        Admin@12345');
  console.log('  carrier  ops@kilimanjaro.test        Carrier@123   (monthly, verified)');
  console.log('  carrier  dispatch@riftvalley.test    Carrier@123   (6 credits)');
  console.log('  carrier  ops@lakeview.test           Carrier@123   (unverified)');
  console.log('  shipper  dispatch@savannah.test      Shipper@123   (5 credits)');
  console.log('  shipper  ops@coasttraders.test       Shipper@123   (monthly)');
  console.log(`  admin user id: ${admin._id}`);
  console.log(`  carrier user: ${carrierUser.name}, shipper user: ${shipperUser.name}, shipper2: ${coastUser.name}, tankers: ${tankerUser.name}`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
