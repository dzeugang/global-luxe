// Pagination des listes admin (l'API renvoie 20 éléments par page)
export const PAGE_SIZE = 20;

export default function Pagination({ page, count, onChange }: {
  page: number;
  count: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);

  // Pages affichées : première, dernière et voisines de la page courante
  const shown = Array.from({ length: pages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);

  return (
    <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
      <span className="text-sm text-gray-500">{from}–{to} sur {count}</span>
      {pages > 1 && (
        <div className="flex gap-1">
          <button onClick={() => onChange(page - 1)} disabled={page === 1} className="w-9 h-9 border border-gray-300 rounded-lg hover:border-gold disabled:opacity-40" aria-label="Page précédente">‹</button>
          {shown.map((p, i) => (
            <span key={p} className="flex gap-1">
              {i > 0 && p - shown[i - 1] > 1 && <span className="w-9 h-9 flex items-center justify-center text-gray-400">…</span>}
              <button
                onClick={() => onChange(p)}
                className={`w-9 h-9 rounded-lg font-bold ${p === page ? 'bg-dark text-white' : 'border border-gray-300 hover:border-gold'}`}
              >
                {p}
              </button>
            </span>
          ))}
          <button onClick={() => onChange(page + 1)} disabled={page === pages} className="w-9 h-9 border border-gray-300 rounded-lg hover:border-gold disabled:opacity-40" aria-label="Page suivante">›</button>
        </div>
      )}
    </div>
  );
}
