import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PLATFORMS, PLATFORM_NAMES, PLATFORM_URLS, PLATFORM_CHART_COLORS } from '../constants/platforms';
import { getPlatformColor } from '../utils/ratingUtils';
import { spacesApi } from '../services/api';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSpace } from '../hooks/useSpace';
import RatingHistoryChart, { SinglePlatformChart } from '../components/UserProfile/RatingHistoryChart';
import EditUserModal from '../components/common/EditUserModal';
import Tooltip from '../components/common/Tooltip';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loading, error, userData, history, refetch } = useUserProfile(id);
  const [showEdit, setShowEdit] = useState(false);

  const spaceId = searchParams.get('spaceId');
  const { space } = useSpace(spaceId);
  const isSpaceAdmin = space?.myRole === 'admin';

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
        <button type="button" className="btn-back" onClick={() => navigate('/')}>
          ← Back to Leaderboard
        </button>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile-page">
        <button type="button" className="btn-back" onClick={() => navigate('/')}>
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
        <div className="profile-name-row">
          <h1 className="user-name">{userData.name}</h1>
          {isSpaceAdmin && (
            <button
              type="button"
              className="btn-edit-profile"
              onClick={() => setShowEdit(true)}
            >
              Edit Handles
            </button>
          )}
        </div>
        <div className="aggregate-badge">
          <span className="aggregate-label">
            Star Rating
            <Tooltip content="Star rating calculated from all platform ratings. Each platform rating is normalized based on skill tiers, then averaged and converted to a 1-10 star scale.">
              <span className="info-badge">ⓘ</span>
            </Tooltip>
          </span>
          <span className="aggregate-value">{userData.aggregateScore
            ? `★ ${(userData.aggregateScore > 10 ? (1 + (userData.aggregateScore / 100) * 9) : userData.aggregateScore).toFixed(1)}/10`
            : 'Unrated'}</span>
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
                const handle = userData.handles?.[platform];
                const rating = userData.ratings?.[platform];

                return (
                  <tr key={platform} className={handle ? '' : 'no-handle'}>
                    <td>
                      <span className="platform-name" style={{ color: PLATFORM_CHART_COLORS[platform] }}>
                        {PLATFORM_NAMES[platform]}
                      </span>
                    </td>
                    <td>
                      {handle ? (
                        <a
                          href={`${PLATFORM_URLS[platform]}${handle}`}
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

      {showEdit && userData && (
        <EditUserModal
          user={userData}
          onSave={async (userId, handles) => {
            await spacesApi.updateTrackedUser(spaceId, userId, handles);
          }}
          onClose={() => setShowEdit(false)}
          onUpdated={refetch}
        />
      )}
    </div>
  );
}

