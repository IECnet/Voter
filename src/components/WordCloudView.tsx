import React, { useMemo } from 'react';
import { Vote } from '../types';

interface WordCloudViewProps {
  votes: Vote[];
}

export const WordCloudView: React.FC<WordCloudViewProps> = ({ votes }) => {
  // Aggregate word frequencies
  const wordStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const vote of votes) {
      if (typeof vote.value === 'string') {
        // Support comma-separated or single submissions
        const tokens = vote.value
          .split(/[,;\n]+/)
          .map(t => t.trim())
          .filter(t => t.length > 0);

        for (const token of tokens) {
          // Normalize capitalization (Title Case for display)
          const clean = token.toLowerCase();
          counts[clean] = (counts[clean] || 0) + 1;
        }
      }
    }

    const entries = Object.entries(counts).map(([word, count]) => {
      // capitalize for clean aesthetic
      const display = word.charAt(0).toUpperCase() + word.slice(1);
      return { word: display, count };
    });

    // Sort descending
    entries.sort((a, b) => b.count - a.count);
    return entries;
  }, [votes]);

  if (wordStats.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-400">
        <p className="text-base font-medium">Waiting for member firms to submit keywords...</p>
        <p className="mt-1 text-sm text-slate-400">Submissions will appear here dynamically as a live word cloud.</p>
      </div>
    );
  }

  const maxCount = Math.max(...wordStats.map(w => w.count), 1);

  // Vibrant, professional palette
  const colors = [
    'text-indigo-600 bg-indigo-50/80 border-indigo-200',
    'text-emerald-600 bg-emerald-50/80 border-emerald-200',
    'text-violet-600 bg-violet-50/80 border-violet-200',
    'text-amber-700 bg-amber-50/80 border-amber-200',
    'text-rose-600 bg-rose-50/80 border-rose-200',
    'text-cyan-700 bg-cyan-50/80 border-cyan-200',
    'text-blue-600 bg-blue-50/80 border-blue-200',
  ];

  return (
    <div className="flex min-h-64 flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-8 shadow-xs">
      {wordStats.map((item, idx) => {
        // Font size calculation from 1rem to 3rem based on frequency
        const scale = item.count / maxCount;
        const fontSizeClass =
          scale > 0.8
            ? 'text-3xl font-extrabold'
            : scale > 0.6
            ? 'text-2xl font-bold'
            : scale > 0.35
            ? 'text-xl font-semibold'
            : 'text-base font-medium';

        const colorClass = colors[idx % colors.length];

        return (
          <div
            key={item.word}
            className={`group inline-flex items-center gap-2 rounded-2xl border px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md ${colorClass} ${fontSizeClass}`}
          >
            <span>{item.word}</span>
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-slate-750 shadow-2xs">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};
