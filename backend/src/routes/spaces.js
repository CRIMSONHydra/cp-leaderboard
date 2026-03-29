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
  searchUsers,
  createAndTrackUser,
  updateTrackedUser
} from '../controllers/spaceUserController.js';
import {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  getSpaceInvitations,
  cancelInvitation,
  searchAccounts
} from '../controllers/invitationController.js';

const router = express.Router();

// All space routes require JWT auth
router.use(jwtAuth);

// Space CRUD
router.post('/', createSpace);
router.get('/', getMySpaces);
router.post('/join', joinSpace);

// Search CP users (for adding to spaces)
router.get('/users/search', searchUsers);

// My pending invitations (must be before /:spaceId)
router.get('/invitations/pending', getMyInvitations);
router.post('/invitations/:invitationId/accept', acceptInvitation);
router.post('/invitations/:invitationId/decline', declineInvitation);

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
router.post('/:spaceId/users/create', requireSpaceRole('admin'), createAndTrackUser);
router.put('/:spaceId/users/:userId', requireSpaceRole('admin'), updateTrackedUser);
router.delete('/:spaceId/users/:userId', requireSpaceRole('admin'), removeUserFromSpace);

// Space invitations
router.get('/:spaceId/invitations', requireSpaceRole('admin'), getSpaceInvitations);
router.post('/:spaceId/invitations', requireSpaceRole('admin'), sendInvitation);
router.delete('/:spaceId/invitations/:invitationId', requireSpaceRole('admin'), cancelInvitation);

// Account search (for inviting members)
router.get('/:spaceId/accounts/search', requireSpaceRole('admin'), searchAccounts);

// Member management
router.get('/:spaceId/members', requireSpaceRole('admin', 'viewer'), getMembers);
router.put('/:spaceId/members/:accountId', requireSpaceRole('admin'), updateMemberRole);
router.delete('/:spaceId/members/:accountId', requireSpaceRole('admin'), removeMember);

export default router;
