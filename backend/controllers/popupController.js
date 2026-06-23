const Popup = require('../models/Popup');

exports.getPopup = async (req, res) => {
  try {
    let popup = await Popup.findOne();
    if (!popup) popup = await Popup.create({});
    res.json({ success: true, popup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePopup = async (req, res) => {
  try {
    const { enabled, imageUrl, title, subtitle, ctaText, showFrequency } = req.body;
    let popup = await Popup.findOne();
    if (!popup) popup = new Popup();
    if (enabled      !== undefined) popup.enabled      = enabled;
    if (imageUrl     !== undefined) popup.imageUrl     = imageUrl;
    if (title        !== undefined) popup.title        = title;
    if (subtitle     !== undefined) popup.subtitle     = subtitle;
    if (ctaText      !== undefined) popup.ctaText      = ctaText;
    if (showFrequency !== undefined) popup.showFrequency = showFrequency;
    await popup.save();
    res.json({ success: true, popup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
