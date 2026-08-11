import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  UsersIcon } from
'lucide-react';
import { Avatar } from '../components/Avatar';
import { DocPill } from '../components/DocPill';
import { CertChip } from '../components/CertChip';
import { ValidityBar } from '../components/ValidityBar';
import { PhoneFrame } from '../components/PhoneFrame';
import { useStore } from '../store';
import {
  countSellers,
  evaluateCase,
  evaluateParty,
  maxGeneration,
  statusTokens } from
'../utils';
import { Case, DOCUMENT_LABELS, Party } from '../types';

export function CaseDetail() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { getCase, cycleDocument, cycleCert } = useStore();
  const c = getCase(caseId);

  if (!c) {
    return (
      <PhoneFrame>
        <div className="p-8 text-center text-sm text-gray-500">Case not found.</div>
      </PhoneFrame>);

  }

  const caseEval = evaluateCase(c);
  const seller = c.parties.find((p) => p.role === 'seller' && p.heirGeneration === 0)!;
  const buyer = c.parties.find((p) => p.role === 'buyer' && p.heirGeneration === 0);
  const sellerCount = countSellers(c.parties);
  const generations = maxGeneration(c.parties);
  const hasHeirs = sellerCount > 1;

  const tokens = statusTokens(caseEval.status);

  return (
    <PhoneFrame>
      {/* Case header */}
      <header className="bg-ink px-5 pb-6 pt-6 text-white md:px-8 md:pb-7 md:pt-8 xl:px-10">
        <div className="mx-auto flex max-w-[1240px] items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to case list"
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gold-soft transition-colors active:bg-white/10">
            
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tabular-nums text-gold-soft">{c.controlNumber}</p>
            <h1 className="mt-1 font-serif text-xl font-semibold leading-tight md:text-2xl">Case review</h1>
            <p className="mt-1 text-sm text-white/70">{c.property.address}</p>
          </div>
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${tokens.badgeBg} ${tokens.badgeText}`}>
            
            <AlertTriangleIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {caseEval.attentionCount} attention
          </span>
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-[#e9dfe5] p-4 md:p-6 xl:p-8">
        <div className="mx-auto grid max-w-[1240px] gap-4 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.45fr)] lg:items-start lg:gap-6">
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* Property summary */}
            <Card>
              <SectionTitle>Property</SectionTitle>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="TD no." value={c.property.tdNo} />
                <Field label="Lot no." value={c.property.lotNo} />
                <Field label="Total area" value={c.property.totalArea} />
                <Field label="Transaction" value={c.transactionType} />
              </dl>
            </Card>

            {/* Heirs link */}
            {hasHeirs &&
            <button
              type="button"
              onClick={() => navigate(`/case/${c.caseId}/heirs`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3.5 text-left transition-colors active:bg-black/[0.03] lg:hover:bg-gold/[0.045]">
              
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <UsersIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {sellerCount} heirs, {generations} generation{generations === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-gray-500">View full lineage</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-300" />
              </button>
            }
          </div>

          <div className="space-y-4">
            {/* Seller / owner detail */}
            <PartySection
              c={c}
              party={seller}
              heading="Seller / owner"
              onCycleDoc={(kind) => cycleDocument(c.caseId, seller.id, kind)}
              onCycleCert={(level) => cycleCert(c.caseId, seller.id, level)} />
            

            {/* Buyer collapsed row */}
            {buyer &&
            <BuyerRow c={c} buyer={buyer} onCycleDoc={cycleDocument} onCycleCert={cycleCert} />
            }
          </div>
        </div>
      </div>
    </PhoneFrame>);

}

// ---- Buyer collapsible (mirrors seller structure) ----

function BuyerRow({
  c,
  buyer,
  onCycleDoc,
  onCycleCert





}: {c: Case;buyer: Party;onCycleDoc: (caseId: string, partyId: string, kind: any) => void;onCycleCert: (caseId: string, partyId: string, level: any) => void;}) {
  const [open, setOpen] = useState(false);
  const e = evaluateParty(buyer);

  if (open) {
    return (
      <PartySection
        c={c}
        party={buyer}
        heading="Buyer / transferee"
        collapsible
        onCollapse={() => setOpen(false)}
        onCycleDoc={(kind) => onCycleDoc(c.caseId, buyer.id, kind)}
        onCycleCert={(level) => onCycleCert(c.caseId, buyer.id, level)} />);


  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3.5 text-left transition-colors active:bg-black/[0.03]">
      
      <Avatar name={buyer.name} status={e.status} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
          Buyer / transferee
        </p>
        <p className="truncate text-sm font-semibold text-ink">{buyer.name}</p>
        <p className="truncate text-xs text-gray-500">{addressLine(buyer)}</p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-gold">View</span>
    </button>);

}

// ---- Reusable party section (seller / heir / buyer) ----

function PartySection({
  c,
  party,
  heading,
  collapsible,
  onCollapse,
  onCycleDoc,
  onCycleCert








}: {c: Case;party: Party;heading: string;collapsible?: boolean;onCollapse?: () => void;onCycleDoc: (kind: any) => void;onCycleCert: (level: any) => void;}) {
  const navigate = useNavigate();
  const e = evaluateParty(party);
  const heirCount = useMemo(
    () => c.parties.filter((p) => p.role === 'seller' && p.parentPartyId === party.id).length,
    [c.parties, party.id]
  );

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Avatar name={party.name} status={e.status} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
            {heading}
          </p>
          <p className="truncate font-semibold text-ink">{party.name}</p>
          <p className="text-xs text-gray-500">{party.civilStatus}</p>
        </div>
        {collapsible &&
        <button
          type="button"
          onClick={onCollapse}
          className="shrink-0 text-xs font-semibold text-gray-400">
          
            Hide
          </button>
        }
      </div>

      {/* Deceased notice */}
      {party.isDeceased && !party.deathCertType &&
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          Deceased · death cert required
        </div>
      }

      {/* Heirs link within seller */}
      {party.role === 'seller' && heirCount > 0 &&
      <button
        type="button"
        onClick={() => navigate(`/case/${c.caseId}/heirs`)}
        className="mt-3 flex w-full items-center justify-between rounded-lg bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
        
          <span>{heirCount} direct heir{heirCount === 1 ? '' : 's'} — view tree</span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      }

      {/* Documents */}
      <div className="mt-4">
        <SubLabel>Documents</SubLabel>
        <ul className="mt-2 divide-y divide-black/5">
          {party.documents.map((doc) =>
          <li key={doc.kind} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-ink">{DOCUMENT_LABELS[doc.kind]}</span>
              <DocPill
              status={doc.status}
              label={DOCUMENT_LABELS[doc.kind]}
              onCycle={() => onCycleDoc(doc.kind)} />
            
            </li>
          )}
        </ul>
      </div>

      {/* Assessor certs */}
      <div className="mt-4">
        <SubLabel>Assessor certification</SubLabel>
        <p className="mt-0.5 text-[11px] text-gray-400">Matched to {addressLine(party)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {party.certs.map((cert) =>
          <CertChip key={cert.level} cert={cert} onTap={() => onCycleCert(cert.level)} />
          )}
        </div>
      </div>

      {/* Landholding validity */}
      {party.landholding &&
      <div className="mt-4">
          <SubLabel>Landholding validity</SubLabel>
          <div className="mt-2">
            <ValidityBar record={party.landholding} />
          </div>
        </div>
      }
    </Card>);

}

// ---- small building blocks ----

function Card({ children }: {children: React.ReactNode;}) {
  return <section className="rounded-2xl border border-black/5 bg-white p-4">{children}</section>;
}

function SectionTitle({ children }: {children: React.ReactNode;}) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gold">{children}</h2>);

}

function SubLabel({ children }: {children: React.ReactNode;}) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{children}</p>);

}

function Field({ label, value }: {label: string;value: string;}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
    </div>);

}

function addressLine(party: Party): string {
  const place = party.address.city || party.address.municipality || '';
  return [place, party.address.province].filter(Boolean).join(', ');
}