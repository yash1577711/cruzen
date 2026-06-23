const SiteConfig = require('../models/SiteConfig');

exports.getConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const config = await SiteConfig.findOne({ key });
    res.json({ success: true, data: config?.data || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { data } = req.body;
    const config = await SiteConfig.findOneAndUpdate(
      { key },
      { $set: { data } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: config.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.patchConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { patch } = req.body; // { [serviceSlug]: { panel, thumb } }
    let config = await SiteConfig.findOne({ key });
    if (!config) config = new SiteConfig({ key, data: {} });
    config.data = { ...config.data, ...patch };
    config.markModified('data');
    await config.save();
    res.json({ success: true, data: config.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
