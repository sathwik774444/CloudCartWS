import mongoose from 'mongoose';

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';

async function run() {
  await connectDB();

  const adminEmail = 'admin@shop.local';
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await User.hashPassword('Admin@123');
    await User.create({ name: 'Admin', email: adminEmail, passwordHash, role: 'admin' });
  }

  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      {
        title: 'Wireless Headphones',
        description: 'Comfortable wireless headphones with deep bass and long battery life.',
        brand: 'SoundMax',
        category: 'Electronics',
        price: 1999,
        images: ['https://via.placeholder.com/600x400?text=Headphones'],
        countInStock: 25,
        isFeatured: true,
      },
      {
        title: 'Running Shoes',
        description: 'Lightweight running shoes designed for comfort and performance.',
        brand: 'FlyRun',
        category: 'Fashion',
        price: 2499,
        images: ['https://via.placeholder.com/600x400?text=Shoes'],
        countInStock: 40,
        isFeatured: true,
      },
      {
        title: 'Smart Watch',
        description: 'Track fitness, heart-rate and notifications with this smart watch.',
        brand: 'WristPro',
        category: 'Electronics',
        price: 3499,
        images: ['https://via.placeholder.com/600x400?text=Smart+Watch'],
        countInStock: 18,
        isFeatured: false,
      },
    ]);
  }

  await mongoose.connection.close();
  console.log('Seed complete');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
