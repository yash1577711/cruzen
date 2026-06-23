const https = require('https');

const send2FactorOTP = async (phone, otp) => {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    console.log(`📱 [DEV] SMS OTP for ${phone}: ${otp}`);
    return { success: true, dev: true };
  }

  // Normalize phone: remove +91 prefix if present
  const normalized = phone.replace(/^\+91/, '').replace(/\D/g, '');

  return new Promise((resolve, reject) => {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${normalized}/${otp}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.Status === 'Success') {
            console.log(`📱 SMS OTP sent to ${normalized} via 2factor.in`);
            resolve({ success: true, sessionId: parsed.Details });
          } else {
            console.error('2factor.in error:', parsed);
            reject(new Error(parsed.Details || 'SMS send failed'));
          }
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
};

module.exports = { send2FactorOTP };
