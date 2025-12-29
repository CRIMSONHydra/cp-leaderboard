import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './RatingHistoryChart.css';

const PLATFORM_COLORS = {
  codeforces: '#1890ff',
  atcoder: '#52c41a',
  leetcode: '#faad14',
  codechef: '#722ed1'
};

const PLATFORM_NAMES = {
  codeforces: 'Codeforces',
  atcoder: 'AtCoder',
  leetcode: 'LeetCode',
  codechef: 'CodeChef'
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">{new Date(label).toLocaleDateString()}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {data[`${entry.dataKey}Contest`] && (
              <span className="tooltip-contest"> ({data[`${entry.dataKey}Contest`]})</span>
            )}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function RatingHistoryChart({ history, platforms }) {
  // Combine all platform histories into a single timeline
  const combinedData = [];
  const dateMap = new Map();

  for (const platform of platforms) {
    const platformHistory = history[platform];
    if (!platformHistory?.success || !platformHistory.data?.length) continue;

    for (const entry of platformHistory.data) {
      const dateKey = entry.date.split('T')[0]; // Use date only, not time
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: entry.date });
      }
      
      const dataPoint = dateMap.get(dateKey);
      dataPoint[platform] = entry.rating;
      dataPoint[`${platform}Contest`] = entry.contestName;
    }
  }

  // Convert map to sorted array
  const sortedData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Fill forward missing values
  const filledData = [];
  const lastValues = {};

  for (const point of sortedData) {
    const newPoint = { ...point };
    
    for (const platform of platforms) {
      if (point[platform] !== undefined) {
        lastValues[platform] = point[platform];
      } else if (lastValues[platform] !== undefined) {
        newPoint[platform] = lastValues[platform];
      }
    }
    
    filledData.push(newPoint);
  }

  if (filledData.length === 0) {
    return (
      <div className="chart-empty">
        <p>No rating history available</p>
      </div>
    );
  }

  return (
    <div className="rating-chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={filledData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#888"
            tick={{ fill: '#888' }}
          />
          <YAxis
            stroke="#888"
            tick={{ fill: '#888' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {platforms.map(platform => (
            history[platform]?.success && history[platform]?.data?.length > 0 && (
              <Line
                key={platform}
                type="monotone"
                dataKey={platform}
                name={PLATFORM_NAMES[platform]}
                stroke={PLATFORM_COLORS[platform]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SinglePlatformChart({ history, platform }) {
  if (!history?.success || !history.data?.length) {
    return (
      <div className="single-chart-empty">
        <p>No history available</p>
      </div>
    );
  }

  const data = history.data.map(entry => ({
    date: entry.date,
    rating: entry.rating,
    contestName: entry.contestName,
    change: entry.change,
    rank: entry.rank
  }));

  return (
    <div className="single-chart-container">
      <h4 style={{ color: PLATFORM_COLORS[platform] }}>
        {PLATFORM_NAMES[platform]}
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#888"
            tick={{ fill: '#888', fontSize: 11 }}
          />
          <YAxis
            stroke="#888"
            tick={{ fill: '#888' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <p className="tooltip-date">{new Date(data.date).toLocaleDateString()}</p>
                    <p className="tooltip-contest">{data.contestName}</p>
                    <p style={{ color: PLATFORM_COLORS[platform] }}>
                      Rating: {data.rating}
                      {data.change !== 0 && (
                        <span className={data.change > 0 ? 'positive' : 'negative'}>
                          {' '}({data.change > 0 ? '+' : ''}{data.change})
                        </span>
                      )}
                    </p>
                    {data.rank && <p className="tooltip-rank">Rank: #{data.rank}</p>}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke={PLATFORM_COLORS[platform]}
            strokeWidth={2}
            dot={{ r: 3, fill: PLATFORM_COLORS[platform] }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

