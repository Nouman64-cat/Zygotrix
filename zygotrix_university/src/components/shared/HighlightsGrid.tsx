interface Highlight {
  id: string;
  metric: string;
  label: string;
  description: string;
}

interface HighlightsGridProps {
  items: Highlight[];
}

const HighlightsGrid = ({ items }: HighlightsGridProps) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-3xl border border-white/8 bg-white/5 p-6 transition duration-300 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/20"
        >
          <span className="text-3xl font-semibold text-white">{item.metric}</span>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
            {item.label}
          </p>
          <p className="mt-3 text-sm text-slate-300">{item.description}</p>
        </div>
      ))}
    </div>
  );
};

export default HighlightsGrid;
