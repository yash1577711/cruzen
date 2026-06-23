const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false },
  serviceName: { type: String },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'active', 'completed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: { type: String, default: 'razorpay' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  payuTxnId: { type: String },
  payuPaymentId: { type: String },
  invoiceNumber: { type: String, unique: true },
  notes: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  posHead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  renewalNotified: { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
