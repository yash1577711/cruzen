import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';

const SERVICES_LIST = [
  'SEO (Search Engine Optimization)', 'SMO (Social Media Optimization)',
  'Website Development', 'Amazon Seller Management', 'Flipkart Seller Management',
  'Graphic Design Services', 'Google Ads Management', '360 Marketing Plans', 'No, I Am Not Sure.',
];

const TIME_SLOTS = [
  '11:00 AM To 12:00 PM', '12:00 PM To 1:00 PM', '1:00 PM To 2:00 PM',
  '2:00 PM To 3:00 PM', '3:00 PM To 4:00 PM', '4:00 PM To 5:00 PM',
  '5:00 PM To 6:00 PM', '6:00 PM To 7:00 PM',
];

export default function ConsultationModal({ isOpen, onClose, preSelectedService }) {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    service: preSelectedService || 'SEO (Search Engine Optimization)',
    date: '',
    timeSlot: '',
    name: '',
    phone: '',
    email: '',
    terms: false,
  });

  useEffect(() => {
    if (preSelectedService) { setForm(f => ({ ...f, service: preSelectedService })); setStep(2); }
    else if (isOpen) { setStep(1); setSuccess(false); }
  }, [isOpen, preSelectedService]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const lineFill = ((step - 1) / 2) * 100;

  const validate = () => {
    if (step === 2) {
      if (!form.date) { toast.error('Please select a date.'); return false; }
      if (!form.timeSlot) { toast.error('Please select a time slot.'); return false; }
    }
    if (step === 3) {
      if (!form.name.trim()) { toast.error('Please enter your name.'); return false; }
      if (!/^[6-9]\d{9}$/.test(form.phone)) { toast.error('Please enter a valid 10-digit mobile number.'); return false; }
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { toast.error('Please enter a valid email.'); return false; }
      if (!form.terms) { toast.error('Please accept the terms and conditions.'); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/consultations', {
        name: form.name, email: form.email, phone: form.phone,
        service: form.service, date: form.date, timeSlot: form.timeSlot,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep(1); setSuccess(false); setForm({ service: SERVICES_LIST[0], date: '', timeSlot: '', name: '', phone: '', email: '', terms: false }); }, 300);
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal-container wizard-box">
        <button className="modal-close" onClick={handleClose}>&times;</button>

        {!success ? (
          <>
            <div className="wizard-header">
              <h2>Get Free Consultation</h2>
              <p>Choose your service and slot to talk with our team.</p>
              <div className="wizard-steps-indicator">
                <div className="wizard-steps-indicator-line-fill" style={{ width: `${lineFill}%` }} />
                {[1, 2, 3].map(n => (
                  <div key={n} className={`step-indicator${step === n ? ' active' : step > n ? ' completed' : ''}`}>
                    <div className="step-indicator-node">
                      {step > n ? <i className="fas fa-check" style={{ fontSize: '0.7rem' }} /> : n}
                    </div>
                    <span>{['Choose Service', 'Pick Slot', 'Personal Info'][n - 1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div key={step} className="wizard-step-transition">
              {step === 1 && (
                <div>
                  <h3>1/3 Take Your Business To A New Height With...</h3>
                  <p className="step-sub">Select the primary service you require assistance with:</p>
                  <div className="radio-grid">
                    {SERVICES_LIST.map(svc => (
                      <label key={svc} className="radio-card">
                        <input type="radio" name="service" value={svc} checked={form.service === svc}
                          onChange={() => setForm(f => ({ ...f, service: svc }))} />
                        <span className="radio-custom" />
                        <span className="radio-label">{svc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3>2/3 Please Fill With Additional Info</h3>
                  <p className="step-sub">Choose a convenient date and time for your consultation call:</p>
                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Select Date</label>
                      <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required />
                    </div>
                    <div className="form-field">
                      <label>Select Time Slot</label>
                      <select value={form.timeSlot} onChange={(e) => setForm(f => ({ ...f, timeSlot: e.target.value }))} required>
                        <option value="">Select your time slot</option>
                        {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3>3/3 Personal Information</h3>
                  <p className="step-sub">How can our expert reach out to you?</p>
                  <div className="form-field">
                    <label>Full Name</label>
                    <input type="text" placeholder="Enter your full name" value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Phone Number</label>
                      <input type="tel" placeholder="10-digit mobile number" value={form.phone}
                        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} required />
                    </div>
                    <div className="form-field">
                      <label>E-mail Address</label>
                      <input type="email" placeholder="Enter your business email" value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-checkbox">
                    <input type="checkbox" id="terms" checked={form.terms}
                      onChange={(e) => setForm(f => ({ ...f, terms: e.target.checked }))} />
                    <label htmlFor="terms">Please accept Terms And Conditions?</label>
                  </div>
                </div>
              )}

              <div className="wizard-footer">
                <button type="button" className="btn btn-outline" disabled={step === 1}
                  onClick={() => setStep(s => s - 1)}>Previous</button>
                {step < 3 ? (
                  <button type="button" className="btn btn-consult"
                    onClick={() => { if (validate()) setStep(s => s + 1); }}>Next</button>
                ) : (
                  <button type="button" className="btn btn-consult" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px 20px' }}>
            <div className="success-screen">
              <div className="success-icon"><i className="fas fa-check-circle"></i></div>
              <h3>Thank You!</h3>
              <p>Your free consultation slot has been booked. Our expert will contact you shortly on the phone number provided.</p>
              <button type="button" className="btn btn-primary-premium" onClick={handleClose}>Close Window</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
