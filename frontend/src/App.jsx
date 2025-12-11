import Header from './components/Layout/Header';
import LeaderboardTable from './components/Leaderboard/LeaderboardTable';
import { useUpdateStatus, useStats } from './hooks/useLeaderboard';
import './App.css';

function App() {
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

export default App;
