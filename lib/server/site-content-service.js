import fs from 'fs/promises';
import path from 'path';
import { defaultSiteContent } from '@/lib/default-site-content';

const contentFilePath = path.join(process.cwd(), 'data', 'site-content.json');

export async function getSiteContent(runQuery) {
  if (process.env.MYSQL_HOST) {
    try {
      const rows = await runQuery('SELECT content FROM site_content WHERE id = 1 LIMIT 1');
      return mergeContent(rows[0]?.content ? JSON.parse(rows[0].content) : {});
    } catch {
      return defaultSiteContent;
    }
  }

  try {
    const file = await fs.readFile(contentFilePath, 'utf8');
    return mergeContent(JSON.parse(file));
  } catch {
    return defaultSiteContent;
  }
}

export async function saveSiteContent(runQuery, nextContent) {
  const content = mergeContent(nextContent);

  if (process.env.MYSQL_HOST) {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INT PRIMARY KEY,
        content JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await runQuery(
      `
        INSERT INTO site_content (id, content)
        VALUES (1, ?)
        ON DUPLICATE KEY UPDATE content = VALUES(content)
      `,
      [JSON.stringify(content)]
    );
    return content;
  }

  await fs.mkdir(path.dirname(contentFilePath), { recursive: true });
  await fs.writeFile(contentFilePath, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
  return content;
}

function mergeContent(content) {
  return {
    home: {
      ...defaultSiteContent.home,
      ...(content.home || {}),
      features: mergeArray(content.home?.features, defaultSiteContent.home.features),
      slides: normalizeSlides(content.home?.slides, defaultSiteContent.home.slides)
    },
    about: {
      ...defaultSiteContent.about,
      ...(content.about || {}),
      values: mergeArray(content.about?.values, defaultSiteContent.about.values)
    },
    contact: {
      ...defaultSiteContent.contact,
      ...(content.contact || {}),
      cards: mergeArray(content.contact?.cards, defaultSiteContent.contact.cards)
    },
    faq: {
      ...defaultSiteContent.faq,
      ...(content.faq || {}),
      items: mergeArray(content.faq?.items, defaultSiteContent.faq.items)
    },
    privacy: {
      ...defaultSiteContent.privacy,
      ...(content.privacy || {}),
      blocks: mergeArray(content.privacy?.blocks, defaultSiteContent.privacy.blocks)
    },
    terms: {
      ...defaultSiteContent.terms,
      ...(content.terms || {}),
      blocks: mergeArray(content.terms?.blocks, defaultSiteContent.terms.blocks)
    }
  };
}

function mergeArray(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function normalizeSlides(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((slide) => ({
      imageUrl: String(slide?.imageUrl || '').trim(),
      title: String(slide?.title || '').trim(),
      copy: String(slide?.copy || '').trim(),
      ctaText: String(slide?.ctaText || '').trim(),
      ctaHref: String(slide?.ctaHref || '').trim(),
      isActive: slide?.isActive !== false
    }))
    .filter((slide) => slide.imageUrl)
    .slice(0, 4);
}
