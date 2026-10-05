const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(admin) {
  return jwt.sign({ id: admin._id.toString(), email: admin.email }, JWT_SECRET, {
    expiresIn: '12h',
  });
}

// Accepts token from Authorization header (Bearer) or httpOnly cookie
function requireAuth(req, res, next) {
  let token = null;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) token = header.slice(7);
  if (!token && req.cookies && req.cookies.pa_token) token = req.cookies.pa_token;

  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.adminId = payload.id;
    req.adminEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

module.exports = { requireAuth, signToken };