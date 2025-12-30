import mongoose from 'mongoose';

const updateLogSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Allow custom string IDs for lock document
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  usersUpdated: { type: Number, default: 0 },
  owner: { type: String, default: null }, // Process identifier for debugging
  errors: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    platform: String,
    error: String
  }]
}, {
  timestamps: true,
  suppressReservedKeysWarning: true, // Suppress warning for 'errors' field
  _id: false // Disable automatic _id generation since we provide it
});

// Index for finding latest update (excluding the lock document)
updateLogSchema.index({ createdAt: -1 });

// Index for efficient lock status checks
updateLogSchema.index({ status: 1, startedAt: 1 });

export default mongoose.model('UpdateLog', updateLogSchema);
