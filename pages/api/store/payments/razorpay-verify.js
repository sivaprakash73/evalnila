import { query } from '@/lib/db';
import { getOrderByGatewayOrderId, updateOrderPaymentByGatewayOrderId } from '@/lib/server/orders-service';
import { verifyRazorpaySignature } from '@/lib/server/razorpay-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    razorpay_payment_id: razorpayPaymentId,
    razorpay_order_id: razorpayOrderId,
    razorpay_signature: razorpaySignature
  } = req.body || {};

  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    return res.status(400).json({ message: 'Missing Razorpay payment response fields.' });
  }

  try {
    const verified = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!verified) {
      return res.status(400).json({ message: 'Razorpay signature verification failed.' });
    }

    const existingOrder = await getOrderByGatewayOrderId(query, razorpayOrderId);

    if (!existingOrder) {
      return res.status(404).json({ message: 'No pending local order found for this Razorpay order.' });
    }

    const order = await updateOrderPaymentByGatewayOrderId(query, razorpayOrderId, {
      paymentStatus: 'Paid',
      status: existingOrder.status || 'Pending',
      paymentGatewayPaymentId: razorpayPaymentId,
      paymentGatewaySignature: razorpaySignature
    });

    return res.status(200).json({ message: 'Payment verified.', order });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to verify Razorpay payment.' });
  }
}
