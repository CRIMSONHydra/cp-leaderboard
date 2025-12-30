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

/**
 * Formats a date as a short month and year (e.g., "Jan 2023") using the en-US locale.
 * @param {string|number|Date} dateString - Value accepted by the Date constructor (ISO string, timestamp, or Date).
 * @returns {string} The formatted month and year (e.g., "Jan 2023").
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Capture tooltip data and cursor side for external rendering.
 *
 * When active and a payload is present, asynchronously calls `onUpdate` with an object
 * containing the current `label`, the tooltip `payload`, and `isRightHalf` (true when the
 * cursor is in the right half of the chart area). The component renders nothing.
 *
 * @param {boolean} active - Whether the chart tooltip is active.
 * @param {Array} payload - Tooltip payload array provided by the chart library.
 * @param {string} label - The x-axis label (typically a date) for the hovered point.
 * @param {{x: number}} coordinate - Cursor coordinate object; `x` is used to determine side.
 * @param {{width?: number}} viewBox - Chart viewBox object; `width` is used to determine chart midpoint.
 * @param {(data: {label: string, payload: Array, isRightHalf: boolean} | null) => void} onUpdate - Callback invoked with the captured tooltip data or `null`.
 */
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

/**
 * Render a combined multi-platform rating history chart with an external, position-aware tooltip.
 *
 * @param {Object} props.history - Mapping of platform keys to their history payloads; each payload should include `success` (boolean) and `data` (array of entries with at least `date` and `rating`).
 * @param {string[]} props.platforms - Ordered list of platform keys to include and display in the chart.
 * @returns {JSX.Element} A React element containing the merged line chart, external tooltip UI, and empty-state message when no data is available.
 */
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

/**
 * Render tooltip content for a single-platform chart when a data point is active.
 *
 * @param {Object} props
 * @param {boolean} props.active - Whether the tooltip is active/visible.
 * @param {Array} props.payload - Chart tooltip payload; expects an array where payload[0].payload is an object containing `date`, `contestName`, `rating`, `change`, and optional `rank`.
 * @param {string} props.platform - Platform key used to determine the rating text color via PLATFORM_COLORS.
 * @returns {JSX.Element|null} A tooltip element showing date, contest name, rating (with change) and optional rank when active and payload is present; otherwise `null`.
 */
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

/**
 * Captures tooltip payload data and forwards it to a provided callback while rendering no UI.
 * @param {Object} props
 * @param {boolean} props.active - Whether the tooltip is currently active/visible.
 * @param {Array} props.payload - Tooltip payload array from the chart; the component uses payload[0].payload when present.
 * @param {(data: Object|null) => void} props.onDataChange - Callback invoked with the captured data object when available, or `null` when there is no payload.
 */
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

/**
 * Render a single-platform rating history chart with an external tooltip area beneath the chart.
 *
 * @param {Object} props
 * @param {Object} props.history - History object for the platform. Expected shape: { success: boolean, data: Array<Object> }.
 *   Each data entry should include: { date: string | number, rating: number, contestName?: string, change?: number, rank?: number }.
 *   If `history.success` is false or `history.data` is empty, the component renders a "No history available" message.
 * @param {string} props.platform - Platform key used to select display name and color (matches keys in PLATFORM_NAMES / PLATFORM_COLORS).
 * @returns {JSX.Element} A React element containing the line chart and an external tooltip area showing the currently hovered data point.
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