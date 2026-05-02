import { query } from '@/lib/db';
import { updateOrderPaymentByGatewayOrderId } from '@/lib/server/orders-service';
import { verifyRazorpayWebhookSignature } from '@/lib/server/razorpay-service';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['x-razorpay-signature'];

  try {
    const verified = verifyRazorpayWebhookSignature(rawBody, signature);

    if (!verified) {
      return res.status(400).json({ message: 'Invalid webhook signature.' });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const gatewayOrderId = paymentEntity?.order_id || orderEntity?.id;

    if (!gatewayOrderId) {
      return res.status(200).json({ message: 'Webhook received without order mapping.' });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      await updateOrderPaymentByGatewayOrderId(query, gatewayOrderId, {
        paymentStatus: 'Paid',
        status: 'Pending',
        paymentGatewayPaymentId: paymentEntity?.id || null
      });
    }

    if (event === 'payment.failed') {
      await updateOrderPaymentByGatewayOrderId(query, gatewayOrderId, {
        paymentStatus: 'Pending',
        status: 'Pending',
        paymentGatewayPaymentId: paymentEntity?.id || null
      });
    }

    if (event === 'payment.authorized') {
      await updateOrderPaymentByGatewayOrderId(query, gatewayOrderId, {
        paymentStatus: 'Pending',
        status: 'Pending',
        paymentGatewayPaymentId: paymentEntity?.id || null
      });
    }

    return res.status(200).json({ message: 'Webhook processed.' });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to process webhook.' });
  }
}

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}
