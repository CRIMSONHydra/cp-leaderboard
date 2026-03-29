import mongoose from 'mongoose';
import Account from '../models/Account.js';
import Space from '../models/Space.js';
import SpaceInvitation from '../models/SpaceInvitation.js';
import { sendSpaceInviteEmail } from '../services/emailService.js';

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const sendInvitation = async (req, res) => {
  try {
    const { email, role } = req.body;
    const space = req.space;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (role && !['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be admin or viewer' });
    }

    const account = await Account.findOne({ email: email.trim().toLowerCase() });
    if (!account) {
      return res.status(404).json({ success: false, error: 'No account found with that email' });
    }

    // Check if already a member
    const isMember = space.members.some(
      m => m.account.toString() === account._id.toString()
    );
    if (isMember) {
      return res.status(409).json({ success: false, error: 'User is already a member of this space' });
    }

    // Check for existing pending invitation
    const existing = await SpaceInvitation.findOne({
      space: space._id,
      invitedAccount: account._id,
      status: 'pending'
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Invitation already pending for this user' });
    }

    const invitation = await SpaceInvitation.create({
      space: space._id,
      invitedBy: req.account.id,
      invitedAccount: account._id,
      role: role || 'viewer'
    });

    // Send email notification
    const inviter = await Account.findById(req.account.id);
    try {
      await sendSpaceInviteEmail(
        account.email,
        space.name,
        inviter?.username || 'Someone',
        role || 'viewer'
      );
    } catch (err) {
      console.error('Failed to send invite email:', err.message);
    }

    res.status(201).json({
      success: true,
      data: {
        _id: invitation._id,
        invitedAccount: { _id: account._id, username: account.username, email: account.email },
        role: invitation.role,
        status: invitation.status
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'Invitation already pending for this user' });
    }
    console.error('Send invitation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getMyInvitations = async (req, res) => {
  try {
    const invitations = await SpaceInvitation.find({
      invitedAccount: req.account.id,
      status: 'pending'
    })
      .populate('space', 'name description')
      .populate('invitedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!isValidObjectId(invitationId)) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    // Atomically claim the invitation (pending -> accepted) to prevent races
    const invitation = await SpaceInvitation.findOneAndUpdate(
      {
        _id: invitationId,
        invitedAccount: req.account.id,
        status: 'pending'
      },
      { status: 'accepted' },
      { returnDocument: 'after' }
    );

    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    // Add to space members atomically
    const result = await Space.findOneAndUpdate(
      {
        _id: invitation.space,
        isActive: true,
        'members.account': { $ne: req.account.id }
      },
      { $push: { members: { account: req.account.id, role: invitation.role } } },
      { returnDocument: 'after' }
    );

    if (!result) {
      // Revert invitation status
      await SpaceInvitation.updateOne({ _id: invitationId }, { status: 'declined' });
      return res.status(409).json({ success: false, error: 'Already a member or space no longer exists' });
    }

    res.json({
      success: true,
      data: { spaceId: invitation.space, role: invitation.role }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const declineInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    if (!isValidObjectId(invitationId)) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const invitation = await SpaceInvitation.findOneAndUpdate(
      {
        _id: invitationId,
        invitedAccount: req.account.id,
        status: 'pending'
      },
      { status: 'declined' },
      { returnDocument: 'after' }
    );

    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getSpaceInvitations = async (req, res) => {
  try {
    const invitations = await SpaceInvitation.find({
      space: req.params.spaceId
    })
      .populate('invitedAccount', 'username email')
      .populate('invitedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: invitations });
  } catch (error) {
    console.error('Get space invitations error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const cancelInvitation = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.invitationId)) {
      return res.status(404).json({ success: false, error: 'Pending invitation not found' });
    }

    const result = await SpaceInvitation.findOneAndDelete({
      _id: req.params.invitationId,
      space: req.params.spaceId,
      status: 'pending'
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Pending invitation not found' });
    }

    res.json({ success: true, message: 'Invitation cancelled' });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const searchAccounts = async (req, res) => {
  try {
    const { email } = req.query;
    const space = req.space;

    if (!email || email.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Email query must be at least 2 characters' });
    }

    const memberAccountIds = space.members.map(m => m.account);

    // Also exclude accounts with pending invitations
    const pendingAccountIds = await SpaceInvitation.distinct('invitedAccount', {
      space: space._id,
      status: 'pending'
    });

    const excludeIds = [...memberAccountIds, ...pendingAccountIds];

    const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const accounts = await Account.find({
      email: new RegExp(escaped, 'i'),
      _id: { $nin: excludeIds }
    })
      .select('username email')
      .limit(10)
      .lean();

    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Search accounts error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  getSpaceInvitations,
  cancelInvitation,
  searchAccounts
};
