const jwt = require('jsonwebtoken');
const User = require('../models/User');

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

exports.signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, secret(), { expiresIn: '7d' });

/**
 * auth() - any authenticated user.
 * auth('carrier') - restrict to a role.
 */
exports.auth = (...roles) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Sign in to continue.' });
    }

    const payload = jwt.verify(token, secret());
    const user = await User.findById(payload.id).populate('company');
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Account no longer exists.' });
    }
    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `This action is limited to ${roles.join(' or ')} accounts.`,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session expired. Sign in again.' });
  }
};
