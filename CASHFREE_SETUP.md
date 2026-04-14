# Cashfree Payment Gateway Setup Guide

This guide will help you set up Cashfree payment gateway in your CloudCart application.

## Prerequisites

1. Cashfree Merchant Account
2. API credentials from Cashfree dashboard

## Step 1: Get Cashfree Credentials

1. Log in to your [Cashfree Dashboard](https://dashboard.cashfree.com/)
2. Navigate to **Settings** → **API Keys**
3. Note down the following:
   - **App ID** (also called Client ID)
   - **Secret Key** (also called Client Secret)
4. Determine your environment:
   - **Sandbox** for testing (default)
   - **Production** for live payments

## Step 2: Update Environment Variables

Add the following to your `backend/.env` file:

```bash
# Cashfree Payment Gateway
CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_SECRET_KEY=your_test_secret_key_here
CASHFREE_ENVIRONMENT=sandbox
```

### For Production:
```bash
CASHFREE_APP_ID=your_live_app_id_here
CASHFREE_SECRET_KEY=your_live_secret_key_here
CASHFREE_ENVIRONMENT=production
```

## Step 3: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Go through the checkout process:
   - Add items to cart
   - Proceed to checkout
   - Fill shipping address
   - Select **Cashfree** as payment provider
   - Click "Create Cashfree Payment Session"
   - Complete payment using Cashfree's payment interface

## Supported Payment Methods

Cashfree supports multiple payment methods:
- **Credit/Debit Cards** (Visa, Mastercard, Maestro, RuPay)
- **UPI** (Unified Payments Interface)
- **NetBanking** (50+ banks supported)
- **Wallets** (Paytm, PhonePe, Amazon Pay, etc.)
- **EMI** options
- **Pay Later** services

## Webhook Configuration (Optional but Recommended)

For production, set up webhooks to receive payment notifications:

1. In Cashfree Dashboard, go to **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payments/cashfree/webhook`
3. Select events to receive:
   - `PAYMENT_SUCCESS`
   - `PAYMENT_FAILED`
   - `PAYMENT_PENDING`

## Testing with Sandbox

Sandbox environment allows you to test without real money:

**Test Card Details:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- Name: Any name

**Test UPI:**
- UPI ID: `test@cashfree`

## Troubleshooting

### Common Issues:

1. **Invalid Credentials**
   - Check if App ID and Secret Key are correct
   - Ensure environment matches (sandbox vs production)

2. **Payment Session Creation Failed**
   - Verify order amount is valid (minimum ₹1 for test)
   - Check if all required order details are provided

3. **Payment Not Redirecting**
   - Ensure return URLs are properly configured
   - Check browser console for JavaScript errors

### Debug Mode:

Add logging to track issues:

```javascript
// In paymentController.js
console.log('Cashfree Config:', {
  appId: env.CASHFREE_APP_ID,
  environment: env.CASHFREE_ENVIRONMENT
});
```

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Enable webhook signatures for production
- Regularly rotate your API keys
- Monitor transaction logs for suspicious activity

## Going Live

1. Switch from sandbox to production credentials
2. Update `CASHFREE_ENVIRONMENT=production`
3. Configure production webhooks
4. Test with small amounts first
5. Monitor initial transactions closely

## Support

- Cashfree Documentation: https://docs.cashfree.com/
- Cashfree Support: support@cashfree.com
- For issues specific to this integration, check the application logs

---

**Important:** Always test thoroughly in sandbox environment before going live with real transactions.
