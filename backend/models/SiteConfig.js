const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  key:  { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
