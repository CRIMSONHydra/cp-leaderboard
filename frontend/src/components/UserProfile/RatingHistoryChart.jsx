import { useState, useRef } from 'react';
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

// Invisible tooltip that captures data and position for external rendering
function DataCaptureTooltip({ active, payload, label, coordinate, viewBox, onUpdate }) {
  if (active && payload && payload.length > 0) {
    const chartWidth = viewBox?.width || 500;
    const cursorX = coordinate?.x || 0;
    const isRightHalf = cursorX > chartWidth / 2;
    
    setTimeout(() => {
      onUpdate({ label, payload, isRightHalf });
    }, 0);
  }
  return null; // Render nothing - we display tooltip externally
}

export default function RatingHistoryChart({ history, platforms }) {
  const [tooltipData, setTooltipData] = useState(null);
  const lastLabelRef = useRef(null);

  const handleTooltipUpdate = (data) => {
    if (data.label !== lastLabelRef.current) {
      lastLabelRef.current = data.label;
      setTooltipData(data);
    }
  };

  const handleMouseLeave = () => {
    lastLabelRef.current = null;
    setTooltipData(null);
  };

  // Combine all platform histories into a single timeline
  const dateMap = new Map();

  for (const platform of platforms) {
    const platformHistory = history[platform];
    if (!platformHistory?.success || !platformHistory.data?.length) continue;

    for (const entry of platformHistory.data) {
      const dateKey = entry.date.split('T')[0];
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: entry.date });
      }
      
      const dataPoint = dateMap.get(dateKey);
      dataPoint[platform] = entry.rating;
    }
  }

  const sortedData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

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
    <div className="rating-chart-container" onMouseLeave={handleMouseLeave}>
      {/* External tooltip - positioned based on cursor location */}
      {tooltipData && (
        <div className={`combined-tooltip ${tooltipData.isRightHalf ? 'tooltip-left' : 'tooltip-right'}`}>
          <div className="chart-tooltip chart-tooltip-compact">
            <p className="tooltip-date">{new Date(tooltipData.label).toLocaleDateString()}</p>
            {tooltipData.payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={350}>
        <LineChart 
          data={filledData} 
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
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
          <Tooltip 
            content={<DataCaptureTooltip onUpdate={handleTooltipUpdate} />}
            cursor={{ stroke: '#666', strokeDasharray: '3 3' }}
          />
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

// Tooltip content for individual charts
function SingleChartTooltipContent({ active, payload, platform }) {
  if (!active || !payload || !payload.length) return null;
  
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

// Hidden tooltip that captures data but renders nothing
function HiddenTooltip({ active, payload, onDataChange }) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    // Schedule state update outside of render
    setTimeout(() => onDataChange(data), 0);
  } else {
    setTimeout(() => onDataChange(null), 0);
  }
  return null;
}

export function SinglePlatformChart({ history, platform }) {
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const lastDataRef = useRef(null);

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

  const handleDataChange = (newData) => {
    // Only update if data actually changed
    if (newData?.date !== lastDataRef.current?.date) {
      lastDataRef.current = newData;
      setTooltipInfo(newData);
    }
  };

  return (
    <div className="single-chart-container">
      <h4 style={{ color: PLATFORM_COLORS[platform] }}>
        {PLATFORM_NAMES[platform]}
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart 
          data={data} 
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
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
            content={<HiddenTooltip onDataChange={handleDataChange} />}
            cursor={{ stroke: '#666', strokeDasharray: '3 3' }}
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
      
      {/* Tooltip displayed below the chart */}
      <div className={`external-tooltip ${tooltipInfo ? 'visible' : ''}`}>
        {tooltipInfo ? (
          <>
            <span className="ext-date">{new Date(tooltipInfo.date).toLocaleDateString()}</span>
            <span className="ext-contest">{tooltipInfo.contestName}</span>
            <span className="ext-rating" style={{ color: PLATFORM_COLORS[platform] }}>
              {tooltipInfo.rating}
              {tooltipInfo.change !== 0 && (
                <span className={tooltipInfo.change > 0 ? 'positive' : 'negative'}>
                  {' '}({tooltipInfo.change > 0 ? '+' : ''}{tooltipInfo.change})
                </span>
              )}
            </span>
            {tooltipInfo.rank && <span className="ext-rank">Rank: #{tooltipInfo.rank}</span>}
          </>
        ) : (
          <span className="ext-hint">Hover over the chart to see details</span>
        )}
      </div>
    </div>
  );
}
