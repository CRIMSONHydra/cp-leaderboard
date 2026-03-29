import express from 'express';
import jwtAuth from '../middlewares/jwtAuth.js';
import { requireSpaceRole } from '../middlewares/spaceAuth.js';
import {
  createSpace,
  getMySpaces,
  getSpace,
  updateSpace,
  deleteSpace,
  regenerateInviteCode,
  joinSpace,
  leaveSpace,
  getMembers,
  updateMemberRole,
  removeMember
} from '../controllers/spaceController.js';
import {
  addUserToSpace,
  removeUserFromSpace,
  getSpaceLeaderboard,
  searchUsers
} from '../controllers/spaceUserController.js';

const router = express.Router();

// All space routes require JWT auth
router.use(jwtAuth);

// Space CRUD
router.post('/', createSpace);
router.get('/', getMySpaces);
router.post('/join', joinSpace);

// Search CP users (for adding to spaces)
router.get('/users/search', searchUsers);

// Space-specific routes
router.get('/:spaceId', getSpace);
router.put('/:spaceId', requireSpaceRole('admin'), updateSpace);
router.delete('/:spaceId', requireSpaceRole('admin'), deleteSpace);
router.post('/:spaceId/invite', requireSpaceRole('admin'), regenerateInviteCode);
router.post('/:spaceId/leave', requireSpaceRole('admin', 'viewer'), leaveSpace);

// Space leaderboard
router.get('/:spaceId/leaderboard', requireSpaceRole('admin', 'viewer'), getSpaceLeaderboard);

// Tracked users management
router.post('/:spaceId/users', requireSpaceRole('admin'), addUserToSpace);
router.delete('/:spaceId/users/:userId', requireSpaceRole('admin'), removeUserFromSpace);

// Member management
router.get('/:spaceId/members', requireSpaceRole('admin', 'viewer'), getMembers);
router.put('/:spaceId/members/:accountId', requireSpaceRole('admin'), updateMemberRole);
router.delete('/:spaceId/members/:accountId', requireSpaceRole('admin'), removeMember);

export default router;
