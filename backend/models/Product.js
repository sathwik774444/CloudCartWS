import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    brand: { type: String, default: '' },
    category: { type: String, index: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', brand: 'text' });

export const Product = mongoose.model('Product', productSchema);
