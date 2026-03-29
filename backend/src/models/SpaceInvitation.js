import mongoose from 'mongoose';

const spaceInvitationSchema = new mongoose.Schema({
  space: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  invitedAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'viewer'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  }
}, {
  timestamps: true
});

spaceInvitationSchema.index(
  { invitedAccount: 1, space: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);
spaceInvitationSchema.index({ space: 1, status: 1 });

export default mongoose.model('SpaceInvitation', spaceInvitationSchema);
