import mongoose from 'mongoose';

const platformRatingSchema = new mongoose.Schema({
  rating: { type: Number, default: null },
  maxRating: { type: Number, default: null },
  rank: { type: String, default: null },
  maxRank: { type: String, default: null },
  lastUpdated: { type: Date, default: null },
  error: { type: String, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  handles: {
    codeforces: { type: String, default: null, trim: true },
    atcoder: { type: String, default: null, trim: true },
    codechef: { type: String, default: null, trim: true },
    leetcode: { type: String, default: null, trim: true }
  },
  ratings: {
    codeforces: { type: platformRatingSchema, default: () => ({}) },
    atcoder: { type: platformRatingSchema, default: () => ({}) },
    codechef: { type: platformRatingSchema, default: () => ({}) },
    leetcode: { type: platformRatingSchema, default: () => ({}) }
  },
  aggregateScore: { type: Number, default: 0 },
  lastFullUpdate: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for leaderboard sorting
userSchema.index({ aggregateScore: -1 });
userSchema.index({ 'ratings.codeforces.rating': -1 });
userSchema.index({ 'ratings.atcoder.rating': -1 });
userSchema.index({ 'ratings.leetcode.rating': -1 });
userSchema.index({ 'ratings.codechef.rating': -1 });
userSchema.index({ isActive: 1 });

export default mongoose.model('User', userSchema);
