const { Router } = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const env = require('../config/env');

const router = Router();

function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

function normalizeIdentity(value) {
  return value.includes('@') ? value.trim().toLowerCase() : value.replace(/[\s()-]/g, '');
}

function validIdentity(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[0-9]{7,15}$/.test(value);
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 6;
}

function createToken(userId) {
  return jwt.sign({}, env.jwtSecret, { subject: userId, expiresIn: env.jwtExpiresIn });
}

router.post('/register', async (req, res, next) => {
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const identity = typeof req.body?.identity === 'string' ? req.body.identity.trim() : '';
  const password = req.body?.password;
  const confirmPassword = req.body?.confirmPassword;
  const normalized = normalizeIdentity(identity);

  if (fullName.length < 2 || fullName.length > 80) {
    return next(httpError(400, 'VALIDATION_ERROR', 'Enter a name between 2 and 80 characters.'));
  }
  if (!validIdentity(normalized)) {
    return next(httpError(400, 'VALIDATION_ERROR', 'Enter a valid email address or phone number.'));
  }
  if (!validPassword(password)) {
    return next(httpError(400, 'VALIDATION_ERROR', 'Password must be at least 6 characters.'));
  }
  if (password !== confirmPassword) {
    return next(httpError(400, 'VALIDATION_ERROR', 'The passwords do not match.'));
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const email = normalized.includes('@') ? normalized : null;
    const phone = email ? null : normalized;
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name AS "fullName", email, phone, created_at AS "createdAt"`,
      [fullName, email, phone, passwordHash]
    );
    const user = result.rows[0];
    res.status(201).json({ token: createToken(user.id), user });
  } catch (error) {
    if (error.code === '23505') {
      return next(httpError(409, 'ACCOUNT_EXISTS', 'An account with that email or phone number already exists.'));
    }
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const identity = typeof req.body.identity === 'string' ? req.body.identity.trim() : '';
    const normalized = normalizeIdentity(identity);
    const password = req.body.password;
    if (!validIdentity(normalized) || !validPassword(password)) {
      throw httpError(400, 'VALIDATION_ERROR', 'Enter a valid email or phone number and a password of at least 6 characters.');
    }
    const result = await pool.query(
      `SELECT id, full_name AS "fullName", email, phone, password_hash,
              created_at AS "createdAt"
       FROM users
       WHERE (email IS NOT NULL AND lower(email) = $1)
          OR (phone IS NOT NULL AND phone = $2)
       LIMIT 1`,
      [normalized, normalized]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw httpError(401, 'INVALID_CREDENTIALS', 'The account identity or password is incorrect.');
    }
    const token = createToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const identity = typeof req.body.identity === 'string' ? req.body.identity.trim() : '';
    const normalized = normalizeIdentity(identity);
    if (!validIdentity(normalized)) {
      throw httpError(400, 'VALIDATION_ERROR', 'Enter a valid email address or phone number.');
    }
    const userResult = await pool.query(
      `SELECT id FROM users
       WHERE (email IS NOT NULL AND lower(email) = $1)
          OR (phone IS NOT NULL AND phone = $2)
       LIMIT 1`,
      [normalized, normalized]
    );
    let resetToken;
    if (userResult.rows[0]) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      await pool.query(
        `UPDATE password_reset_tokens
         SET used_at = now()
         WHERE user_id = $1 AND used_at IS NULL`,
        [userResult.rows[0].id]
      );
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, now() + interval '20 minutes')`,
        [userResult.rows[0].id, tokenHash]
      );
    }
    const response = { message: 'If an account matches that information, password reset instructions are available.' };
    if (env.assignmentMode && resetToken) response.resetToken = resetToken;
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  if (typeof token !== 'string' || token.length < 32 || !validPassword(password)) {
    return next(httpError(400, 'VALIDATION_ERROR', 'Enter a valid reset token and a password of at least 6 characters.'));
  }
  if (password !== confirmPassword) {
    return next(httpError(400, 'VALIDATION_ERROR', 'The passwords do not match.'));
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE password_reset_tokens
       SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [tokenHash]
    );
    if (!result.rows[0]) {
      throw httpError(400, 'INVALID_RESET_TOKEN', 'The reset token is invalid, expired, or already used.');
    }
    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [passwordHash, result.rows[0].user_id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
