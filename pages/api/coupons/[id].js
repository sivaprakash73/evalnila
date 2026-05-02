import { query } from '@/lib/db';
import { deleteCoupon, updateCouponStatus } from '@/lib/server/coupons-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'PATCH') {
    try {
      const coupon = await updateCouponStatus(query, req.query.id, req.body?.isActive);
      return res.status(200).json({ message: 'Coupon updated.', coupon });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to update coupon.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteCoupon(query, req.query.id);
      return res.status(200).json({ message: 'Coupon deleted.' });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to delete coupon.' });
    }
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
