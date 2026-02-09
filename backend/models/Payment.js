import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    provider: { type: String, enum: ['stripe'], default: 'stripe' },
    paymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'inr' },
    status: { type: String, default: 'created' },
    raw: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
