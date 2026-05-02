import crypto from 'crypto';

export async function registerCustomer(runQuery, payload) {
  const {
    firstName,
    lastName,
    email,
    password,
    phone = '',
    address = '',
    city = '',
    country = ''
  } = payload;

  if (!firstName || !lastName || !email || !password) {
    throw new Error('First name, last name, email, and password are required.');
  }

  if (!process.env.MYSQL_HOST) {
    return {
      id: Date.now(),
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country
    };
  }

  const existing = await runQuery(
    `
      SELECT id
      FROM customers
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  if (existing[0]) {
    throw new Error('An account already exists for this email.');
  }

  const passwordHash = hashPassword(password);

  const result = await runQuery(
    `
      INSERT INTO customers (
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        address_line,
        city,
        country
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [firstName, lastName, email, passwordHash, phone, address, city, country]
  );

  return getCustomerById(runQuery, result.insertId);
}

export async function authenticateCustomer(runQuery, email, password) {
  if (!email || !password) {
    return null;
  }

  if (!process.env.MYSQL_HOST) {
    return null;
  }

  const rows = await runQuery(
    `
      SELECT
        id,
        first_name AS firstName,
        last_name AS lastName,
        email,
        password_hash AS passwordHash,
        phone,
        address_line AS address,
        city,
        country
      FROM customers
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  const customer = rows[0];

  if (!customer || !customer.passwordHash) {
    return null;
  }

  if (!verifyPassword(password, customer.passwordHash)) {
    return null;
  }

  return stripPassword(customer);
}

export async function getCustomerById(runQuery, id) {
  if (!process.env.MYSQL_HOST) {
    return {
      id: Number(id),
      firstName: 'Evalnila',
      lastName: 'Customer',
      email: 'customer@example.com',
      phone: '+1 800 555 0147',
      address: 'Commerce Avenue',
      city: 'Austin',
      country: 'USA'
    };
  }

  const rows = await runQuery(
    `
      SELECT
        id,
        first_name AS firstName,
        last_name AS lastName,
        email,
        phone,
        address_line AS address,
        city,
        country
      FROM customers
      WHERE id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
}

export async function updateCustomerProfile(runQuery, id, payload) {
  const { firstName, lastName, email, phone = '', address = '', city = '', country = '' } = payload;

  if (!firstName || !lastName || !email) {
    throw new Error('First name, last name, and email are required.');
  }

  if (!process.env.MYSQL_HOST) {
    return {
      id: Number(id),
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country
    };
  }

  await runQuery(
    `
      UPDATE customers
      SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        address_line = ?,
        city = ?,
        country = ?
      WHERE id = ?
    `,
    [firstName, lastName, email, phone, address, city, country, Number(id)]
  );

  return getCustomerById(runQuery, id);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash.startsWith('scrypt$')) {
    return false;
  }

  const [, salt, hash] = storedHash.split('$');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
}

function stripPassword(customer) {
  const { passwordHash, ...rest } = customer;
  return rest;
}
