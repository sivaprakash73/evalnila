import crypto from 'crypto';

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  assertRazorpayConfigured();

  const response = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.description || 'Unable to create Razorpay order.');
  }

  return payload;
}

export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  assertRazorpayConfigured();

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(razorpaySignature)
  );
}

export function verifyRazorpayWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Missing Razorpay webhook secret. Set RAZORPAY_WEBHOOK_SECRET.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature || '')
  );
}

function assertRazorpayConfigured() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Missing Razorpay configuration. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
}
