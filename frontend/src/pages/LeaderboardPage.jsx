import Header from '../components/Layout/Header';
import LeaderboardTable from '../components/Leaderboard/LeaderboardTable';
import { useUpdateStatus, useStats } from '../hooks/useLeaderboard';

/**
 * Render the leaderboard page layout.
 *
 * Renders a page containing a Header (provided with the latest update timestamp and stats), the LeaderboardTable in the main content area, and a footer that shows the ratings update frequency and tracked platforms.
 * @returns {JSX.Element} The root JSX element for the leaderboard page.
 */
export default function LeaderboardPage() {
  const { status } = useUpdateStatus();
  const { stats } = useStats();

  return (
    <div className="app">
      <Header
        lastUpdate={status?.completedAt}
        stats={stats}
      />
      <main className="main-content">
        <LeaderboardTable />
      </main>
      <footer className="app-footer">
        <p>Ratings update every 12 hours</p>
        <p className="platforms">
          Tracking: Codeforces | AtCoder | LeetCode | CodeChef
        </p>
      </footer>
    </div>
  );
}
