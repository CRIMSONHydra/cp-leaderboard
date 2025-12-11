const mongoose = require('mongoose');

const updateLogSchema = new mongoose.Schema({
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  usersUpdated: { type: Number, default: 0 },
  errors: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    platform: String,
    error: String
  }]
}, {
  timestamps: true
});

// Index for finding latest update
updateLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UpdateLog', updateLogSchema);
