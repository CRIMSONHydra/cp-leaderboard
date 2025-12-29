import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getPlatformColor } from '../utils/ratingUtils';
import RatingHistoryChart, { SinglePlatformChart } from '../components/UserProfile/RatingHistoryChart';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import './UserProfilePage.css';

const PLATFORMS = ['codeforces', 'atcoder', 'leetcode', 'codechef'];

const PLATFORM_INFO = {
  codeforces: { name: 'Codeforces', color: '#1890ff', url: 'https://codeforces.com/profile/' },
  atcoder: { name: 'AtCoder', color: '#52c41a', url: 'https://atcoder.jp/users/' },
  leetcode: { name: 'LeetCode', color: '#faad14', url: 'https://leetcode.com/u/' },
  codechef: { name: 'CodeChef', color: '#722ed1', url: 'https://www.codechef.com/users/' }
};

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getUserHistory(id);
        if (response.success) {
          setUserData(response.data.user);
          setHistory(response.data.history);
        } else {
          setError(response.error || 'Failed to load user data');
        }
      } catch (err) {
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [id]);

  if (loading) {
    return (
      <div className="user-profile-page">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Back to Leaderboard
        </button>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile-page">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Back to Leaderboard
        </button>
        <ErrorMessage message="User not found" />
      </div>
    );
  }

  const activePlatforms = PLATFORMS.filter(
    p => userData.handles?.[p] && userData.ratings?.[p]?.rating
  );

  return (
    <div className="user-profile-page">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← Back to Leaderboard
      </button>

      <div className="profile-header">
        <h1 className="user-name">{userData.name}</h1>
        <div className="aggregate-badge">
          <span className="aggregate-label">Normalized Score</span>
          <span className="aggregate-value">{userData.aggregateScore || 0}</span>
        </div>
      </div>

      <section className="ratings-section">
        <h2>Platform Ratings</h2>
        <div className="ratings-table-container">
          <table className="ratings-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Handle</th>
                <th>Current Rating</th>
                <th>Highest Rating</th>
                <th>Current Rank</th>
                <th>Highest Rank</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map(platform => {
                const info = PLATFORM_INFO[platform];
                const handle = userData.handles?.[platform];
                const rating = userData.ratings?.[platform];
                
                return (
                  <tr key={platform} className={handle ? '' : 'no-handle'}>
                    <td>
                      <span className="platform-name" style={{ color: info.color }}>
                        {info.name}
                      </span>
                    </td>
                    <td>
                      {handle ? (
                        <a
                          href={`${info.url}${handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="handle-link"
                        >
                          {handle}
                        </a>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>
                    <td>
                      {rating?.rating ? (
                        <span 
                          className="rating-value" 
                          style={{ color: getPlatformColor(platform, rating.rating, rating.rank) }}
                        >
                          {rating.rating}
                        </span>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>
                    <td>
                      {rating?.maxRating ? (
                        <span 
                          className="max-rating" 
                          style={{ color: getPlatformColor(platform, rating.maxRating, rating.maxRank) }}
                        >
                          {rating.maxRating}
                        </span>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>
                    <td>
                      {rating?.rank ? (
                        <span 
                          className="rank-text"
                          style={{ color: getPlatformColor(platform, rating.rating, rating.rank) }}
                        >
                          {rating.rank}
                        </span>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>
                    <td>
                      {rating?.maxRank ? (
                        <span 
                          className="rank-text"
                          style={{ color: getPlatformColor(platform, rating.maxRating, rating.maxRank) }}
                        >
                          {rating.maxRank}
                        </span>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {history && activePlatforms.length > 0 && (
        <>
          <section className="history-section">
            <h2>Combined Rating History</h2>
            <RatingHistoryChart history={history} platforms={activePlatforms} />
          </section>

          <section className="individual-charts-section">
            <h2>Individual Platform History</h2>
            <div className="charts-grid">
              {activePlatforms.map(platform => (
                <SinglePlatformChart
                  key={platform}
                  history={history[platform]}
                  platform={platform}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {(!history || activePlatforms.length === 0) && (
        <section className="no-history-section">
          <p>No rating history available for this user.</p>
        </section>
      )}
    </div>
  );
}

