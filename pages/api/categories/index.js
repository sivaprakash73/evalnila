import { query } from '@/lib/db';
import { createCategory, getCategories } from '@/lib/server/categories-service';
import { requireApiAuth } from '@/lib/server/with-auth';

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const categories = await getCategories(query);
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: 'Unable to load categories.', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const category = await createCategory(query, req.body || {});
      return res.status(201).json({ message: 'Category created.', category });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to create category.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method not allowed' });
}
