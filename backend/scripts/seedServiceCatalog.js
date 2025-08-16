#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const ServiceCatalogItem = require('../models/ServiceCatalogItem');

const DEFAULTS = [
  ['CHK_BASIC','Základní kontrola', 'diagnostika', 20, 0],
  ['CHK_FULL','Kompletní diagnostika', 'diagnostika', 50, 490],
  ['DRIVetrain_ADJ','Seřízení pohonu', 'pohon', 30, 390],
  ['BRAKE_BLEED','Odkalení / odvzdušnění brzd', 'brzdy', 45, 590],
  ['BRAKE_PAD_SWAP','Výměna brzdových destiček', 'brzdy', 25, 250],
  ['SUSP_SERVICE','Servis odpružení (základ)', 'odpruzeni', 60, 990],
  ['WHEEL_TRUE','Centrovaní kola', 'kola', 35, 350],
  ['TUBELESS_SETUP','Nastavení bezdušového pláště', 'kola', 30, 450],
  ['CLEAN_DETAIL','Detailní čištění', 'cisteni', 40, 390],
  ['COMP_REPLACE','Výměna komponentu', 'obecne', 30, 290],
  ['SOFTWARE_UPDATE','Aktualizace firmware (elektro)', 'elektronika', 25, 290],
  ['CHAIN_REPLACE','Výměna řetězu', 'pohon', 20, 240],
  ['CASSETTE_REPLACE','Výměna kazety', 'pohon', 25, 290],
  ['BEARING_SERVICE','Servis ložisek', 'rama', 80, 1290],
  ['HEADSET_ADJ','Seřízení hlavového složení', 'rama', 15, 190]
];

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/cykloservis';
  await mongoose.connect(uri, {});
  for (const [code,name,category,baseMinutes,basePrice] of DEFAULTS) {
    await ServiceCatalogItem.updateOne({ code }, { $set: { name, category, baseMinutes, basePrice, active: true } }, { upsert: true });
    console.log('Upserted', code);
  }
  await mongoose.disconnect();
})();
