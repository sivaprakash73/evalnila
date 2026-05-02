import { query } from '@/lib/db';
import { createCoupon, getCoupons } from '@/lib/server/coupons-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const coupons = await getCoupons(query);
      return res.status(200).json(coupons);
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load coupons.', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const coupon = await createCoupon(query, req.body || {});
      return res.status(201).json({ message: 'Coupon created.', coupon });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to create coupon.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method not allowed' });
}
