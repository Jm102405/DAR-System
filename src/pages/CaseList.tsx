import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon, PlusIcon, ScaleIcon, SearchIcon } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { StatusBadge } from '../components/StatusBadge';
import { PhoneFrame } from '../components/PhoneFrame';
import { useStore } from '../store';
import { useAuth } from '../lib/auth';
import { CaseEval, evaluateCase } from '../utils';
import { Case } from '../types';

type FilterKey = 'all' | 'missing' | 'expiring' | 'ready';

const FILTERS: {key: FilterKey;label: string;}[] = [
{ key: 'all', label: 'All' },
{ key: 'missing', label: 'Missing docs' },
{ key: 'expiring', label: 'Expiring soon' },
{ key: 'ready', label: 'Ready' }];


function matchesFilter(evalResult: CaseEval, filter: FilterKey): boolean {
  switch (filter) {
    case 'missing':
      return evalResult.status === 'lacking' || evalResult.status === 'expired';
    case 'expiring':
      return evalResult.status === 'expiring';
    case 'ready':
      return evalResult.status === 'ready';
    default:
      return true;
  }
}

export function CaseList() {
  const { cases, loading, error, reload } = useStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.
    map((c) => ({ c, e: evaluateCase(c) })).
    filter(({ c, e }) => {
      if (!matchesFilter(e, filter)) return false;
      if (!q) return true;
      const seller = c.parties.find((p) => p.role === 'seller' && p.heirGeneration === 0);
      return (
        (seller?.name.toLowerCase().includes(q) ?? false) ||
        c.controlNumber.toLowerCase().includes(q) ||
        c.property.address.toLowerCase().includes(q));

    });
  }, [cases, query, filter]);

  return (
    <PhoneFrame>
      {/* Legal workspace header */}
      <header className="bg-ink px-5 pb-4 pt-5 text-white md:px-8 md:pb-7 md:pt-8 xl:px-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold-soft">
              <ScaleIcon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold leading-tight md:text-3xl">DAR clearance tracker</h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gold-soft/80">
                Land clearance case desk
              </p>
            </div>
          </div>

          {/* Search + new transaction */}
          <div className="flex w-full flex-row items-center gap-2 sm:gap-3 lg:w-auto lg:justify-end">
            <div className="relative min-w-0 flex-1 sm:min-w-[260px] lg:max-w-[400px]">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search owner, control no. or address"
                className="w-full rounded-xl border border-white/20 bg-white py-3 pl-10 pr-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-gold" />
              
            </div>
            <button
              type="button"
              onClick={() => navigate('/case/new')}
              title="New transaction"
              aria-label="New transaction"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold px-3 py-3 text-sm font-semibold text-ink-dark transition-colors hover:bg-gold-soft sm:px-4">
              
              <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">New transaction</span>
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-3 text-sm font-semibold text-gold-soft transition-colors hover:bg-white/10">
              
              <LogOutIcon className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Filter chips */}
      <div className="sticky top-0 z-10 border-b border-ink/10 bg-canvas px-5 py-3 md:px-8 xl:px-10">
        <div className="no-scrollbar mx-auto flex max-w-[1240px] gap-2 overflow-x-auto">
        {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ?
                'border-ink bg-ink text-white' :
                'border-black/10 bg-white text-ink/70'}`
                }>
                
              {f.label}
            </button>);

          })}
        </div>
      </div>

      {/* List */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-0 md:px-8 md:py-5 xl:px-10">
        {loading ?
        <div className="px-6 py-16 text-center text-sm text-gray-400">
            Loading cases…
          </div> :
        error ?
        <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-red-700">Couldn't load cases</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">{error}</p>
            <button
            type="button"
            onClick={() => reload()}
            className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-light">
              
              Try again
            </button>
          </div> :
        rows.length === 0 ?
        <div className="px-6 py-16 text-center text-sm text-gray-400">
            No cases match this view.
          </div> :

        <ul className="mx-auto divide-y divide-black/5 md:grid md:max-w-[1240px] md:grid-cols-2 md:gap-4 md:divide-y-0 xl:grid-cols-3">
            {rows.map(({ c, e }) =>
          <CaseRow key={c.caseId} c={c} e={e} onOpen={() => navigate(`/case/${c.caseId}`)} />
          )}
          </ul>
        }
      </div>
    </PhoneFrame>);

}

function CaseRow({ c, e, onOpen }: {c: Case;e: CaseEval;onOpen: () => void;}) {
  const seller = c.parties.find((p) => p.role === 'seller' && p.heirGeneration === 0);
  if (!seller) return null;
  return (
    <li className="md:rounded-2xl md:border md:border-ink/10 md:bg-white">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors active:bg-black/[0.03] md:min-h-[128px] md:rounded-2xl md:p-5 md:hover:bg-gold/[0.045]">
        
        <Avatar name={seller.name} status={e.status} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-ink">{seller.name}</p>
            <span className="shrink-0 pt-0.5 text-[11px] font-medium tabular-nums text-gray-400">
              {c.controlNumber}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">{c.property.address}</p>
          <div className="mt-2">
            <StatusBadge evalResult={e} />
          </div>
        </div>
      </button>
    </li>);

}