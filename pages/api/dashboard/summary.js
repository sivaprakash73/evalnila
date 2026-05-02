import { query } from '@/lib/db';
import { buildDashboardResponse } from '@/lib/server/dashboard-service';

export default async function handler(req, res) {
  try {
    const data = await buildDashboardResponse(query);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: 'Unable to load dashboard summary.',
      error: error.message
    });
  }
}
