const { fetchCodeforcesRating } = require('./codeforces');
const { fetchAtCoderRating } = require('./atcoder');
const { fetchLeetCodeRating } = require('./leetcode');
const { fetchCodeChefRating } = require('./codechef');

const fetchers = {
  codeforces: fetchCodeforcesRating,
  atcoder: fetchAtCoderRating,
  leetcode: fetchLeetCodeRating,
  codechef: fetchCodeChefRating
};

module.exports = fetchers;
