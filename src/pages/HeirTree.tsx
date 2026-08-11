import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangleIcon, ArrowLeftIcon, ChevronLeftIcon } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { PhoneFrame } from '../components/PhoneFrame';
import { useStore } from '../store';
import { buildTree, countSellers, evaluateParty, maxGeneration, TreeNode } from '../utils';
import { Party } from '../types';

export function HeirTree() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { getCase } = useStore();
  const c = getCase(caseId);

  if (!c) {
    return (
      <PhoneFrame>
        <div className="p-8 text-center text-sm text-gray-500">Case not found.</div>
      </PhoneFrame>);

  }

  const tree = buildTree(c.parties, 'seller');
  const sellerCount = countSellers(c.parties);
  const generations = maxGeneration(c.parties);

  return (
    <PhoneFrame>
      <header className="bg-ink px-5 pb-6 pt-6 text-white md:px-8 md:pb-7 md:pt-8 xl:px-10">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/case/${c.caseId}`)}
            aria-label="Back to case"
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gold-soft transition-colors active:bg-white/10">
            
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-semibold leading-tight md:text-2xl">Heir tree</h1>
            <p className="mt-0.5 text-sm tabular-nums text-gold-soft">{c.controlNumber}</p>
          </div>
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-[#e9dfe5] p-4 md:p-6 xl:p-8">
        <div className="mx-auto grid max-w-[1240px] gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 md:p-6">
            {tree.map((node) =>
            <TreeBranch key={node.party.id} node={node} depth={0} />
            )}
          </div>

          {/* Summary/footer */}
          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4 md:px-5 lg:h-fit lg:sticky lg:top-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Lineage summary</p>
            <p className="mt-2 text-base font-semibold text-ink">
              {sellerCount} seller{sellerCount === 1 ? '' : 's'} across {generations + 1} generation
              {generations === 0 ? '' : 's'}
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">Addresses at the deepest level determine the required assessor certifications.</p>
            <button
              type="button"
              onClick={() => navigate(`/case/${c.caseId}`)}
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold">
              
              <ChevronLeftIcon className="h-4 w-4" />
              Back to case
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>);

}

function TreeBranch({ node, depth }: {node: TreeNode;depth: number;}) {
  const hasChildren = node.children.length > 0;
  return (
    <div className={depth === 0 ? '' : 'relative pl-6'}>
      {/* connector line for nested generations */}
      {depth > 0 &&
      <span
        className="absolute left-[9px] top-0 h-full w-px bg-gold/30"
        aria-hidden="true" />

      }
      <HeirNode party={node.party} nested={depth > 0} />
      {hasChildren &&
      <div className="mt-2 space-y-2">
          {node.children.map((child) =>
        <TreeBranch key={child.party.id} node={child} depth={depth + 1} />
        )}
        </div>
      }
    </div>);

}

function HeirNode({ party, nested }: {party: Party;nested: boolean;}) {
  const e = evaluateParty(party);
  const genLabel =
  party.heirGeneration === 0 ?
  'Owner / seller · generation 0' :
  `Heir · generation ${party.heirGeneration}`;
  const place = party.address.city || party.address.municipality || '';
  const addressLine = [place, party.address.province].filter(Boolean).join(', ');

  return (
    <div className={`relative flex items-start gap-3 ${nested ? 'py-1' : 'pb-2'}`}>
      {nested &&
      <span
        className="absolute left-[-15px] top-[22px] h-px w-3.5 bg-gold/30"
        aria-hidden="true" />

      }
      <Avatar name={party.name} status={e.status} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{party.name}</p>
        <p className="text-[11px] uppercase tracking-wider text-gold">{genLabel}</p>
        {party.isDeceased &&
        <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">
            <AlertTriangleIcon className="h-3 w-3" />
            {party.deathCertType ?
          `Deceased · ${party.deathCertType} on file` :
          'Deceased · death cert required'}
          </span>
        }
        <p className="mt-1 truncate text-xs text-gray-500">{addressLine}</p>
      </div>
    </div>);

}