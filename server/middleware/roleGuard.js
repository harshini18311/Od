// server/middleware/roleGuard.js
/**
 * Middleware to restrict endpoint access to specific roles.
 * @param {string[]} allowedRoles - List of permitted roles
 */
export function roleGuard(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: `Forbidden. This action is restricted to roles: [${allowedRoles.join(', ')}]. Current role: ${role}` });
    }

    next();
  };
}
