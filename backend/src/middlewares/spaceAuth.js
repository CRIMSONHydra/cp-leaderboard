import Space from '../models/Space.js';

/**
 * Middleware factory that checks if the authenticated user
 * has one of the required roles in the space.
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'viewer')
 */
export function requireSpaceRole(...roles) {
  return async (req, res, next) => {
    try {
      const { spaceId } = req.params;
      const accountId = req.account.id;

      const space = await Space.findOne({ _id: spaceId, isActive: true });

      if (!space) {
        return res.status(404).json({ success: false, error: 'Space not found' });
      }

      const membership = space.members.find(
        m => m.account.toString() === accountId
      );

      if (!membership) {
        return res.status(403).json({ success: false, error: 'Not a member of this space' });
      }

      if (roles.length > 0 && !roles.includes(membership.role)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }

      req.space = space;
      req.spaceMembership = membership;
      next();
    } catch (error) {
      console.error('Space auth error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}
