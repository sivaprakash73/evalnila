import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { requireApiAuth } from '@/lib/server/with-auth';

export const config = {
  api: {
    bodyParser: false
  }
};

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
]);

export default async function handler(req, res) {
  const authorized = await requireApiAuth(req, res);

  if (!authorized) {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const file = await readMultipartImage(req);
    const extension = ALLOWED_TYPES.get(file.contentType);
    const fileName = `${crypto.randomUUID()}${extension}`;
    const imageUrl = await saveProductImage(file, fileName);

    return res.status(201).json({ imageUrl });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message || 'Unable to upload product image.' });
  }
}

async function saveProductImage(file, fileName) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${fileName}`, file.content, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.contentType
    });

    return blob.url;
  }

  if (process.env.VERCEL) {
    const error = new Error('Product image uploads need Vercel Blob storage. Add BLOB_READ_WRITE_TOKEN in Vercel project environment variables.');
    error.statusCode = 500;
    throw error;
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
  const uploadPath = path.join(uploadDir, fileName);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(uploadPath, file.content);

  return `/uploads/products/${fileName}`;
}

async function readMultipartImage(req) {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

  if (!boundaryMatch) {
    throw new Error('Upload must use multipart form data.');
  }

  const body = await readRequestBody(req);
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  let cursor = body.indexOf(boundary);

  while (cursor !== -1) {
    const partStart = cursor + boundary.length;
    const nextBoundary = body.indexOf(boundary, partStart);

    if (nextBoundary === -1) {
      break;
    }

    const part = trimPart(body.subarray(partStart, nextBoundary));
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));

    if (headerEnd !== -1) {
      const headerText = part.subarray(0, headerEnd).toString('utf8');
      const content = part.subarray(headerEnd + 4);
      const disposition = headerText.match(/content-disposition:[^\r\n]+/i)?.[0] || '';
      const contentTypeHeader = headerText.match(/content-type:\s*([^\r\n]+)/i);

      if (/name="image"/i.test(disposition) && /filename="/i.test(disposition)) {
        const imageType = contentTypeHeader?.[1]?.trim().toLowerCase();

        if (!ALLOWED_TYPES.has(imageType)) {
          throw new Error('Only JPG, PNG, WebP, or GIF images are allowed.');
        }

        if (!content.length) {
          throw new Error('Choose an image to upload.');
        }

        if (content.length > MAX_UPLOAD_BYTES) {
          throw new Error('Product image must be 4 MB or smaller.');
        }

        return {
          content,
          contentType: imageType
        };
      }
    }

    cursor = nextBoundary;
  }

  throw new Error('Choose an image to upload.');
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;

    req.on('data', (chunk) => {
      totalSize += chunk.length;

      if (totalSize > MAX_UPLOAD_BYTES + 1024 * 1024) {
        req.destroy(new Error('Product image must be 4 MB or smaller.'));
        return;
      }

      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function trimPart(part) {
  let start = 0;
  let end = part.length;

  if (part[start] === 13 && part[start + 1] === 10) {
    start += 2;
  }

  if (part[end - 2] === 13 && part[end - 1] === 10) {
    end -= 2;
  }

  return part.subarray(start, end);
}
