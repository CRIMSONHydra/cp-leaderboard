import mongoose from 'mongoose';

const adminCredentialSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for fast username lookups
adminCredentialSchema.index({ username: 1 });

export default mongoose.model('AdminCredential', adminCredentialSchema);

