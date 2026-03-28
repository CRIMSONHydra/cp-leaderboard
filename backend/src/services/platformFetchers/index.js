import { fetchCodeforcesRating } from './codeforces.js';
import { fetchAtCoderRating } from './atcoder.js';
import { fetchLeetCodeRating } from './leetcode.js';
import { fetchCodeChefRating } from './codechef.js';

const fetchers = {
  codeforces: fetchCodeforcesRating,
  atcoder: fetchAtCoderRating,
  leetcode: fetchLeetCodeRating,
  codechef: fetchCodeChefRating
};

export default fetchers;
