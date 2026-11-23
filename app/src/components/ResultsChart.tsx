import { memo, useMemo } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { percent } from '../lib/polls';

const COLORS = ['#8b5cf6', '#14b8a6', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#06b6d4', '#eab308'];

type Props = { options: string[]; counts: bigint[]; total: bigint };

/**
 * Horizontal bar chart of the votes per option.
 * Memoized: the poll page re-renders every second (live status clock), and a new `data`
 * array would make Recharts replay its bar animation and hide the labels each time.
 * SWR keeps `options` / `counts` referentially stable while the on-chain data is unchanged.
 */
export const ResultsChart = memo(function ResultsChart({ options, counts, total }: Props) {
  const data = useMemo(
    () =>
      options.map((name, i) => ({
        name,
        votes: Number(counts[i] ?? 0n),
        pct: percent(counts[i] ?? 0n, total),
      })),
    [options, counts, total],
  );

  return (
    <div style={{ height: Math.max(160, data.length * 48) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48 }}>
          <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={12} />
          <YAxis type="category" dataKey="name" width={110} stroke="#94a3b8" fontSize={12} />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.08)' }}
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
            formatter={(value, _name, item) => [`${value} votes (${item.payload.pct}%)`, '']}
          />
          <Bar dataKey="votes" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#cbd5e1', fontSize: 12 }}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
