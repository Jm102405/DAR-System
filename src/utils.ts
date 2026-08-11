import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  AssessorCert,
  Case,
  JurisdictionLevel,
  LandholdingRecord,
  Party,
  ValidityStatus } from
'./types';

// ---- People helpers ----

export function initials(name: string): string {
  const cleaned = name.replace(/\(.*?\)/g, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---- Date / validity helpers ----

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'MMM d, yyyy');
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

const EXPIRY_WINDOW_DAYS = 30;

export function validityFromExpiry(expiryIso?: string): ValidityStatus {
  if (!expiryIso) return 'none';
  const d = daysUntil(expiryIso);
  if (d < 0) return 'expired';
  if (d <= EXPIRY_WINDOW_DAYS) return 'expiring';
  return 'valid';
}

// Landholding 8-month window progress (0..1 elapsed)
export function landholdingProgress(record: LandholdingRecord): number {
  const start = parseISO(record.requestDate).getTime();
  const end = parseISO(record.expiryDate).getTime();
  const now = Date.now();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export function humanRemaining(expiryIso: string): string {
  const d = daysUntil(expiryIso);
  if (d < 0) return 'Expired — re-file required';
  if (d === 0) return 'Expires today';
  if (d < 45) return `${d} day${d === 1 ? '' : 's'} left`;
  const months = Math.round(d / 30);
  return `${months} month${months === 1 ? '' : 's'} left`;
}

// ---- Jurisdiction matching ----
// An address maps to which of the 3 assessor certs are required.
// If the address is a city, the "municipal" level is N/A and "city" applies.
// Provincial always applies.
export function requiredJurisdictions(party: Party): Record<JurisdictionLevel, boolean> {
  const isCity = Boolean(party.address.city);
  return {
    municipal: !isCity,
    city: isCity,
    provincial: true
  };
}

// ---- Party completeness ----

export type PartyStatus = 'ready' | 'lacking' | 'expiring' | 'expired';

export interface PartyEval {
  status: PartyStatus;
  lackingCount: number; // number of attention items
  landholding: ValidityStatus;
  soonestExpiryDays: number | null;
}

export function evaluateParty(party: Party): PartyEval {
  let lacking = 0;
  let hasExpired = false;
  let hasExpiring = false;
  let soonest: number | null = null;

  const track = (iso?: string) => {
    if (!iso) return;
    const d = daysUntil(iso);
    if (soonest === null || d < soonest) soonest = d;
  };

  // Deceased with no death cert type = attention
  if (party.isDeceased && !party.deathCertType) lacking += 1;

  // Documents
  for (const doc of party.documents) {
    if (doc.status === 'lacking') lacking += 1;
  }

  // Certs (only required ones count)
  for (const cert of party.certs) {
    if (!cert.required) continue;
    if (cert.status === 'lacking') {
      lacking += 1;
    } else if (cert.status === 'yes') {
      const v = validityFromExpiry(cert.validUntil);
      if (v === 'expired') {
        hasExpired = true;
        lacking += 1;
      } else if (v === 'expiring') {
        hasExpiring = true;
        track(cert.validUntil);
      }
    }
  }

  // Landholding
  let landholding: ValidityStatus = 'none';
  if (party.landholding) {
    landholding = validityFromExpiry(party.landholding.expiryDate);
    if (landholding === 'expired') {
      hasExpired = true;
      lacking += 1;
    } else if (landholding === 'expiring') {
      hasExpiring = true;
      track(party.landholding.expiryDate);
    }
  } else {
    // no landholding record yet is an attention item for a seller-side party
    if (party.role === 'seller') lacking += 1;
  }

  let status: PartyStatus;
  if (hasExpired) status = 'expired';else
  if (lacking > 0) status = 'lacking';else
  if (hasExpiring) status = 'expiring';else
  status = 'ready';

  return { status, lackingCount: lacking, landholding, soonestExpiryDays: soonest };
}

// ---- Case-level rollup (worst wins) ----

export interface CaseEval {
  status: PartyStatus;
  attentionCount: number;
  soonestExpiryDays: number | null;
}

const SEVERITY: Record<PartyStatus, number> = {
  ready: 0,
  expiring: 1,
  lacking: 2,
  expired: 3
};

export function evaluateCase(c: Case): CaseEval {
  let worst: PartyStatus = 'ready';
  let attention = 0;
  let soonest: number | null = null;

  for (const p of c.parties) {
    const e = evaluateParty(p);
    attention += e.lackingCount;
    if (SEVERITY[e.status] > SEVERITY[worst]) worst = e.status;
    if (e.soonestExpiryDays !== null) {
      if (soonest === null || e.soonestExpiryDays < soonest) soonest = e.soonestExpiryDays;
    }
  }

  return { status: worst, attentionCount: attention, soonestExpiryDays: soonest };
}

// ---- Heir tree helpers ----

export interface TreeNode {
  party: Party;
  children: TreeNode[];
}

export function buildTree(parties: Party[], role: 'seller' | 'buyer' = 'seller'): TreeNode[] {
  const scoped = parties.filter((p) => p.role === role);
  const byParent = new Map<string | null, Party[]>();
  for (const p of scoped) {
    const key = p.parentPartyId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(p);
  }
  const make = (party: Party): TreeNode => ({
    party,
    children: (byParent.get(party.id) || []).map(make)
  });
  return (byParent.get(null) || []).map(make);
}

export function countSellers(parties: Party[]): number {
  return parties.filter((p) => p.role === 'seller').length;
}

export function maxGeneration(parties: Party[], role: 'seller' | 'buyer' = 'seller'): number {
  return parties.
  filter((p) => p.role === role).
  reduce((m, p) => Math.max(m, p.heirGeneration), 0);
}

// ---- Status color tokens (Tailwind class fragments) ----

export interface StatusTokens {
  avatarBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dot: string;
}

export function statusTokens(status: PartyStatus): StatusTokens {
  switch (status) {
    case 'ready':
      return {
        avatarBg: 'bg-success',
        badgeBg: 'bg-success-soft',
        badgeText: 'text-success',
        badgeBorder: 'border-success-border',
        dot: 'bg-success'
      };
    case 'expiring':
      return {
        avatarBg: 'bg-warning',
        badgeBg: 'bg-warning-soft',
        badgeText: 'text-warning',
        badgeBorder: 'border-warning-border',
        dot: 'bg-warning'
      };
    case 'expired':
      return {
        avatarBg: 'bg-danger-strong',
        badgeBg: 'bg-danger-soft',
        badgeText: 'text-danger-strong',
        badgeBorder: 'border-danger-border',
        dot: 'bg-danger-strong'
      };
    case 'lacking':
    default:
      return {
        avatarBg: 'bg-danger',
        badgeBg: 'bg-danger-soft',
        badgeText: 'text-danger',
        badgeBorder: 'border-danger-border',
        dot: 'bg-danger'
      };
  }
}