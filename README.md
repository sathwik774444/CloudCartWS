# Ecommerce MERN (CloudCart)

## Features

- JWT auth with role-based access (user/admin)
- Product browsing with search, filter, sort, pagination
- Cart persistence (MongoDB)
- Checkout flow: address -> payment intent -> confirmation
- Orders: history + admin management
- Inventory updates on payment confirmation
- Email hook for order confirmations (SMTP optional)

## Tech

- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Zod, Stripe
- Frontend: React (CRA), react-router-dom, axios

## Project Structure

- `backend/` REST API
- `frontend/` React UI

## Environment Variables

Create `Ecommerce-MERN/.env` (backend reads process env) using `.env.example` as reference.

Minimum required for backend:

- `MONGO_URI`
- `JWT_SECRET`

Optional:

- `STRIPE_SECRET_KEY`
- SMTP vars for emails

Frontend optional:

- `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`)

## Setup (Local)

### 1) Install dependencies

From `Ecommerce-MERN/`:

- `npm install`

This installs workspace deps for both `backend` and `frontend`.

### 2) Start MongoDB

Use your local MongoDB instance OR docker-compose.

### 3) Seed sample data (optional)

From `Ecommerce-MERN/`:

- `npm run seed --workspace backend`

Creates an admin user:

- Email: `admin@shop.local`
- Password: `Admin@123`

### 4) Run the app

From `Ecommerce-MERN/`:

- `npm run dev`

- Backend: `http://localhost:5000/api/health`
- Frontend: `http://localhost:3000`

## Key API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/cart` (auth)
- `POST /api/orders` (auth) -> creates order from cart
- `POST /api/payments/intent` (auth) -> Stripe PaymentIntent
- `POST /api/payments/confirm-mock` (auth) -> local dev confirmation

## Notes

- Payments: for production, you should confirm payment via Stripe webhooks. The project includes a local `confirm-mock` endpoint to simulate the flow while developing.
