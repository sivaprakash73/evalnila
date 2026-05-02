import { query } from '@/lib/db';
import { requireApiAuth } from '@/lib/server/with-auth';
import { getSiteContent, saveSiteContent } from '@/lib/server/site-content-service';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    const content = await getSiteContent(query);
    return res.status(200).json({ content });
  }

  if (req.method === 'PUT') {
    try {
      const content = await saveSiteContent(query, req.body?.content || {});
      return res.status(200).json({ message: 'Site content saved.', content });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to save site content.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ message: 'Method not allowed' });
}
