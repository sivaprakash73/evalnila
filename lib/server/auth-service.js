import crypto from 'crypto';

export async function authenticateUser(runQuery, email, password) {
  if (!process.env.MYSQL_HOST) {
    const fallbackEmail = process.env.ADMIN_EMAIL || 'admin@evalnila.com';
    const fallbackPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === fallbackEmail && password === fallbackPassword) {
      return {
        id: 1,
        name: 'Evalnila Admin',
        email: fallbackEmail,
        role: 'admin'
      };
    }

    return null;
  }

  const rows = await runQuery(
    `
      SELECT id, name, email, role, password_hash AS passwordHash
      FROM admin_users
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  const user = rows[0];

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  if (storedHash.startsWith('scrypt$')) {
    const [, salt, hash] = storedHash.split('$');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
  }

  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(legacyHash), Buffer.from(storedHash));
}
