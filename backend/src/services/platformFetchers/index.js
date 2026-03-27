import { fetchCodeforcesRating } from './codeforces.js';
import { fetchAtCoderRating } from './atcoder.js';
import { fetchLeetCodeRating } from './leetcode.js';
import { fetchCodeChefRating } from './codechef.js';

export const codeforces = fetchCodeforcesRating;
export const atcoder = fetchAtCoderRating;
export const leetcode = fetchLeetCodeRating;
export const codechef = fetchCodeChefRating;

const fetchers = {
  codeforces: fetchCodeforcesRating,
  atcoder: fetchAtCoderRating,
  leetcode: fetchLeetCodeRating,
  codechef: fetchCodeChefRating
};

export default fetchers;
