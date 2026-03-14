# CloudCart E-commerce Platform

A modern, full-stack e-commerce application built with React and Node.js.

## 🚀 Features

- **User Management**: JWT authentication with role-based access (user/admin)
- **Product Catalog**: Advanced search, filtering, sorting, and pagination
- **Shopping Cart**: Persistent cart with real-time updates
- **Order Management**: Complete checkout flow with order history
- **Payment Integration**: Stripe payment processing
- **Admin Dashboard**: Product and order management
- **Email Notifications**: Order confirmations and updates
- **File Uploads**: Cloudinary integration for product images

## 🏗️ Architecture

### Frontend (React)
- React 18 with modern hooks
- React Router for navigation
- Axios for API communication
- Responsive design

### Backend (Node.js)
- Express.js REST API
- MongoDB with Mongoose ODM
- JWT authentication
- Stripe payment processing
- Cloudinary file uploads
- Comprehensive error handling

## 📦 Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios

### Backend
- Node.js 18+
- Express.js
- MongoDB (Mongoose)
- JWT
- Stripe
- Multer (file uploads)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cloudcart.git
   cd cloudcart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker-compose up -d mongo
   
   # Or use your local MongoDB instance
   ```

5. **Seed sample data (optional)**
   ```bash
   npm run seed
   ```

6. **Run the application**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000/api/health

## 📁 Project Structure

```
cloudcart/
├── backend/                 # Node.js API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── package.json       # Backend dependencies
├── frontend/               # React application
│   ├── public/            # Static assets
│   ├── src/               # React components
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── package.json       # Frontend dependencies
├── docker-compose.yml     # Local development
├── package.json           # Workspace configuration
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_mern
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=no-reply@your-domain.com
```

#### Frontend (.env.local)
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_ENVIRONMENT=development
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

##  Payment Integration

### Stripe
- Payment Intents API
- Webhook handling
- Refund processing
- Test mode support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in GitHub

---

**Built with ❤️ for modern e-commerce**
