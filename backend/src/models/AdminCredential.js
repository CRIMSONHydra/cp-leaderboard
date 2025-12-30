import mongoose from 'mongoose';

const adminCredentialSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // This already creates an index, no need for manual index
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Note: No need for manual index on username since 'unique: true' already creates one

export default mongoose.model('AdminCredential', adminCredentialSchema);

