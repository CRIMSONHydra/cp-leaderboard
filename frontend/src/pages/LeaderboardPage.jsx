import { PLATFORM_NAMES } from '../constants/platforms';
import Header from '../components/Layout/Header';
import LeaderboardTable from '../components/Leaderboard/LeaderboardTable';
import { useLeaderboard, useUpdateStatus, useStats } from '../hooks/useLeaderboard';

export default function LeaderboardPage() {
  const { status } = useUpdateStatus();
  const { stats } = useStats();
  const { data, loading, error, sortBy, sortOrder, handleSort, refetch } = useLeaderboard();

  return (
    <div className="app">
      <Header
        lastUpdate={status?.completedAt}
        stats={stats}
      />
      <main className="main-content">
        <LeaderboardTable
          data={data}
          loading={loading}
          error={error}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRetry={refetch}
        />
      </main>
      <footer className="app-footer">
        <p>Ratings update every 12 hours</p>
        <p className="platforms">
          Tracking: {Object.values(PLATFORM_NAMES).join(' | ')}
        </p>
      </footer>
    </div>
  );
}
