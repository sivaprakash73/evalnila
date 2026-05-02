import { createRazorpayOrder } from '@/lib/server/razorpay-service';
import { query, getPool } from '@/lib/db';
import { createStoreOrder, getStoreOrderEstimate } from '@/lib/server/orders-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { customer, items } = req.body || {};

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'At least one cart item is required.' });
  }

  try {
    const totals = await getStoreOrderEstimate(query, items);

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(totals.total * 100),
      currency: 'INR',
      receipt: `evalnila_${Date.now()}`,
      notes: {
        customer_email: customer?.email || '',
        customer_name: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim()
      }
    });

    const order = await createStoreOrder(
      query,
      {
        customer,
        items,
        paymentMethod: 'razorpay',
        paymentStatus: 'Pending',
        paymentGateway: 'razorpay',
        paymentGatewayOrderId: razorpayOrder.id
      },
      process.env.MYSQL_HOST ? getPool() : null
    );

    return res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      order
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to create Razorpay order.' });
  }
}
