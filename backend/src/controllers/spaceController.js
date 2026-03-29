import Space from '../models/Space.js';

const createSpace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Space name is required' });
    }

    const inviteCode = Space.generateInviteCode();

    const space = await Space.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.account.id,
      members: [{ account: req.account.id, role: 'admin' }],
      inviteCode
    });

    res.status(201).json({
      success: true,
      data: space
    });
  } catch (error) {
    console.error('Create space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getMySpaces = async (req, res) => {
  try {
    const spaces = await Space.find({
      'members.account': req.account.id,
      isActive: true
    })
      .select('name description owner members trackedUsers inviteCode createdAt')
      .populate('owner', 'username')
      .lean();

    // Add member's role to each space
    const spacesWithRole = spaces.map(space => {
      const membership = space.members.find(
        m => m.account.toString() === req.account.id
      );
      return {
        ...space,
        myRole: membership?.role || 'viewer',
        memberCount: space.members.length,
        trackedUserCount: space.trackedUsers.length
      };
    });

    res.json({ success: true, data: spacesWithRole });
  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getSpace = async (req, res) => {
  try {
    const space = await Space.findOne({ _id: req.params.spaceId, isActive: true })
      .populate('owner', 'username')
      .populate('members.account', 'username email')
      .lean();

    if (!space) {
      return res.status(404).json({ success: false, error: 'Space not found' });
    }

    const membership = space.members.find(
      m => m.account._id.toString() === req.account.id
    );

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Not a member of this space' });
    }

    res.json({
      success: true,
      data: { ...space, myRole: membership.role }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid space ID' });
    }
    console.error('Get space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const updateSpace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, error: 'Space name cannot be empty' });
      }
      updates.name = name.trim();
    }
    if (description !== undefined) updates.description = description.trim();

    const space = await Space.findByIdAndUpdate(
      req.params.spaceId,
      { $set: updates },
      { new: true }
    );

    res.json({ success: true, data: space });
  } catch (error) {
    console.error('Update space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const deleteSpace = async (req, res) => {
  try {
    const space = req.space;

    if (space.owner.toString() !== req.account.id) {
      return res.status(403).json({ success: false, error: 'Only the owner can delete a space' });
    }

    space.isActive = false;
    await space.save();

    res.json({ success: true, message: 'Space deleted' });
  } catch (error) {
    console.error('Delete space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const regenerateInviteCode = async (req, res) => {
  try {
    const space = req.space;
    space.inviteCode = Space.generateInviteCode();
    await space.save();

    res.json({ success: true, data: { inviteCode: space.inviteCode } });
  } catch (error) {
    console.error('Regenerate invite error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const joinSpace = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Invite code is required' });
    }

    const space = await Space.findOne({ inviteCode, isActive: true });

    if (!space) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    const alreadyMember = space.members.some(
      m => m.account.toString() === req.account.id
    );

    if (alreadyMember) {
      return res.status(409).json({ success: false, error: 'Already a member of this space' });
    }

    space.members.push({ account: req.account.id, role: 'viewer' });
    await space.save();

    res.json({
      success: true,
      data: { spaceId: space._id, name: space.name, role: 'viewer' }
    });
  } catch (error) {
    console.error('Join space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const leaveSpace = async (req, res) => {
  try {
    const space = req.space;

    if (space.owner.toString() === req.account.id) {
      return res.status(400).json({
        success: false,
        error: 'Owner cannot leave the space. Transfer ownership or delete the space.'
      });
    }

    space.members = space.members.filter(
      m => m.account.toString() !== req.account.id
    );
    await space.save();

    res.json({ success: true, message: 'Left the space' });
  } catch (error) {
    console.error('Leave space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getMembers = async (req, res) => {
  try {
    const space = await Space.findOne({ _id: req.params.spaceId, isActive: true })
      .populate('members.account', 'username email')
      .lean();

    if (!space) {
      return res.status(404).json({ success: false, error: 'Space not found' });
    }

    res.json({ success: true, data: space.members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { spaceId, accountId } = req.params;

    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be admin or viewer' });
    }

    const space = req.space;
    const member = space.members.find(m => m.account.toString() === accountId);

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    if (space.owner.toString() === accountId && role !== 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot change owner role' });
    }

    member.role = role;
    await space.save();

    res.json({ success: true, data: { accountId, role } });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { spaceId, accountId } = req.params;
    const space = req.space;

    if (space.owner.toString() === accountId) {
      return res.status(400).json({ success: false, error: 'Cannot remove the owner' });
    }

    const memberIndex = space.members.findIndex(m => m.account.toString() === accountId);

    if (memberIndex === -1) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    space.members.splice(memberIndex, 1);
    await space.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export {
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
};
