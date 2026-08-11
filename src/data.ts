import { Case, DocumentKind, DocumentStatus, JurisdictionLevel, TriState } from './types';

// Reference "now" for the mock data ≈ Jul 26 2026.
// Helper builders keep the seed readable.

function docs(entries: Partial<Record<DocumentKind, TriState>>): DocumentStatus[] {
  const order: DocumentKind[] = ['title_td', 'deed', 'affidavit_retention', 'spa'];
  return order.map((kind) => ({ kind, status: entries[kind] ?? 'lacking' }));
}

function certs(
entries: Partial<Record<JurisdictionLevel, {status: TriState;validUntil?: string;certNo?: string;dateIssued?: string;}>>,
isCity: boolean)
{
  const levels: JurisdictionLevel[] = ['municipal', 'city', 'provincial'];
  return levels.map((level) => {
    const required =
    level === 'provincial' ? true : level === 'city' ? isCity : !isCity;
    const e = entries[level];
    return {
      level,
      required,
      status: (e?.status ?? (required ? 'lacking' : 'na')) as TriState,
      validUntil: e?.validUntil,
      certNo: e?.certNo,
      dateIssued: e?.dateIssued
    };
  });
}

export const SEED_CASES: Case[] = [
// ---------- CASE 1: multi-generation heirs, mixed states ----------
{
  caseId: 'c1',
  controlNumber: '0006-2026',
  transactionType: 'EJS with DOAS',
  dateOpened: '2026-04-10',
  property: {
    caseId: 'c1',
    titleNo: 'OCT-4471',
    tdNo: 'TD-2019-00312',
    totalArea: '2.40 ha',
    soldArea: '1.10 ha',
    lotNo: 'Lot 1123, Pls-231',
    address: 'Brgy. Malaya, Sta. Cruz, Laguna'
  },
  parties: [
  {
    id: 'p1-seller',
    caseId: 'c1',
    role: 'seller',
    name: 'Eduardo Villaraza',
    civilStatus: 'Married (deceased)',
    address: { municipality: 'Sta. Cruz', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: true,
    deathCertType: 'PSA',
    documents: docs({ title_td: 'yes', deed: 'yes', affidavit_retention: 'na', spa: 'na' }),
    certs: certs(
      {
        municipal: { status: 'yes', validUntil: '2027-02-01', certNo: 'M-0091', dateIssued: '2026-06-01' },
        provincial: { status: 'yes', validUntil: '2026-08-14', certNo: 'P-0442', dateIssued: '2026-02-14' }
      },
      false
    ),
    landholding: {
      requestDate: '2026-02-10',
      expiryDate: '2026-10-10',
      existingLandholding: '2.40 ha',
      toBeTransferred: '1.10 ha'
    }
  },
  // Gen 1 heirs
  {
    id: 'p1-h1',
    caseId: 'c1',
    role: 'seller',
    name: 'Marisol Villaraza-Cruz',
    civilStatus: 'Married',
    address: { municipality: 'Pila', province: 'Laguna' },
    parentPartyId: 'p1-seller',
    heirGeneration: 1,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'na', deed: 'na', affidavit_retention: 'yes', spa: 'yes' }),
    certs: certs(
      {
        municipal: { status: 'yes', validUntil: '2027-01-20' },
        provincial: { status: 'yes', validUntil: '2027-01-20' }
      },
      false
    ),
    landholding: null
  },
  {
    id: 'p1-h2',
    caseId: 'c1',
    role: 'seller',
    name: 'Ramon Villaraza',
    civilStatus: 'Widower (deceased)',
    address: { municipality: 'Sta. Cruz', province: 'Laguna' },
    parentPartyId: 'p1-seller',
    heirGeneration: 1,
    isDeceased: true,
    deathCertType: null, // MISSING death cert -> attention
    documents: docs({ title_td: 'na', deed: 'na', affidavit_retention: 'lacking', spa: 'na' }),
    certs: certs({ provincial: { status: 'lacking' } }, false),
    landholding: null
  },
  // Gen 2 — children of deceased Ramon
  {
    id: 'p1-h2a',
    caseId: 'c1',
    role: 'seller',
    name: 'Andres Villaraza',
    civilStatus: 'Single',
    address: { city: 'Calamba', province: 'Laguna' },
    parentPartyId: 'p1-h2',
    heirGeneration: 2,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'na', deed: 'na', affidavit_retention: 'yes', spa: 'yes' }),
    certs: certs(
      {
        city: { status: 'yes', validUntil: '2027-03-01' },
        provincial: { status: 'yes', validUntil: '2027-03-01' }
      },
      true
    ),
    landholding: null
  },
  {
    id: 'p1-h2b',
    caseId: 'c1',
    role: 'seller',
    name: 'Lucia Villaraza-Ramos',
    civilStatus: 'Married (deceased)',
    address: { municipality: 'Pagsanjan', province: 'Laguna' },
    parentPartyId: 'p1-h2',
    heirGeneration: 2,
    isDeceased: true,
    deathCertType: 'LCRO',
    documents: docs({ title_td: 'na', deed: 'na', affidavit_retention: 'yes', spa: 'na' }),
    certs: certs({ municipal: { status: 'lacking' }, provincial: { status: 'lacking' } }, false),
    landholding: null
  },
  // Gen 3 — child of deceased Lucia
  {
    id: 'p1-h2b1',
    caseId: 'c1',
    role: 'seller',
    name: 'Miguel Ramos',
    civilStatus: 'Single',
    address: { municipality: 'Pagsanjan', province: 'Laguna' },
    parentPartyId: 'p1-h2b',
    heirGeneration: 3,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'na', deed: 'na', affidavit_retention: 'lacking', spa: 'lacking' }),
    certs: certs({ municipal: { status: 'lacking' }, provincial: { status: 'lacking' } }, false),
    landholding: null
  },
  // Buyer
  {
    id: 'p1-buyer',
    caseId: 'c1',
    role: 'buyer',
    name: 'Grace Ann Delfin',
    civilStatus: 'Single',
    address: { city: 'San Pablo', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'na', deed: 'yes', affidavit_retention: 'na', spa: 'na' }),
    certs: certs(
      {
        city: { status: 'yes', validUntil: '2027-05-01' },
        provincial: { status: 'yes', validUntil: '2027-05-01' }
      },
      true
    ),
    landholding: null
  }]

},

// ---------- CASE 2: expiring soon, single seller ----------
{
  caseId: 'c2',
  controlNumber: '0007-2026',
  transactionType: 'Deed of Absolute Sale',
  dateOpened: '2026-01-05',
  property: {
    caseId: 'c2',
    titleNo: 'TCT-118902',
    tdNo: 'TD-2021-00841',
    totalArea: '0.85 ha',
    soldArea: '0.85 ha',
    lotNo: 'Lot 44-B, Psd-118',
    address: 'Brgy. San Isidro, Nagcarlan, Laguna'
  },
  parties: [
  {
    id: 'p2-seller',
    caseId: 'c2',
    role: 'seller',
    name: 'Corazon Buenavista',
    civilStatus: 'Widow',
    address: { municipality: 'Nagcarlan', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'yes', deed: 'yes', affidavit_retention: 'yes', spa: 'na' }),
    certs: certs(
      {
        municipal: { status: 'yes', validUntil: '2026-08-20' },
        provincial: { status: 'yes', validUntil: '2027-01-01' }
      },
      false
    ),
    landholding: {
      requestDate: '2026-01-05',
      expiryDate: '2026-09-05',
      existingLandholding: '0.85 ha',
      toBeTransferred: '0.85 ha'
    }
  },
  {
    id: 'p2-buyer',
    caseId: 'c2',
    role: 'buyer',
    name: 'Jonathan Reyes',
    civilStatus: 'Married',
    address: { municipality: 'Nagcarlan', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'na', deed: 'yes', affidavit_retention: 'na', spa: 'na' }),
    certs: certs(
      {
        municipal: { status: 'yes', validUntil: '2027-04-01' },
        provincial: { status: 'yes', validUntil: '2027-04-01' }
      },
      false
    ),
    landholding: null
  }]

},

// ---------- CASE 3: fully ready ----------
{
  caseId: 'c3',
  controlNumber: '0008-2026',
  transactionType: 'EJS with DOAS',
  dateOpened: '2026-05-18',
  property: {
    caseId: 'c3',
    titleNo: 'OCT-9921',
    tdNo: 'TD-2022-01190',
    totalArea: '1.20 ha',
    soldArea: '0.60 ha',
    lotNo: 'Lot 77, Pls-410',
    address: 'Brgy. Bubukal, Sta. Cruz, Laguna'
  },
  parties: [
  {
    id: 'p3-seller',
    caseId: 'c3',
    role: 'seller',
    name: 'Teresita Almonte',
    civilStatus: 'Single',
    address: { municipality: 'Sta. Cruz', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'yes', deed: 'yes', affidavit_retention: 'yes', spa: 'yes' }),
    certs: certs(
      {
        municipal: { status: 'yes', validUntil: '2027-06-01' },
        provincial: { status: 'yes', validUntil: '2027-06-01' }
      },
      false
    ),
    landholding: {
      requestDate: '2026-05-18',
      expiryDate: '2027-01-18',
      existingLandholding: '1.20 ha',
      toBeTransferred: '0.60 ha'
    }
  },
  {
    id: 'p3-buyer',
    caseId: 'c3',
    role: 'buyer',
    name: 'Paolo Enriquez',
    civilStatus: 'Married',
    address: { city: 'Calamba', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'na', deed: 'yes', affidavit_retention: 'na', spa: 'na' }),
    certs: certs(
      {
        city: { status: 'yes', validUntil: '2027-06-01' },
        provincial: { status: 'yes', validUntil: '2027-06-01' }
      },
      true
    ),
    landholding: null
  }]

},

// ---------- CASE 4: expired landholding ----------
{
  caseId: 'c4',
  controlNumber: '0004-2026',
  transactionType: 'Deed of Donation',
  dateOpened: '2025-10-02',
  property: {
    caseId: 'c4',
    titleNo: 'TCT-77410',
    tdNo: 'TD-2018-00220',
    totalArea: '3.10 ha',
    soldArea: '1.55 ha',
    lotNo: 'Lot 902, Pls-77',
    address: 'Brgy. Labuin, Pila, Laguna'
  },
  parties: [
  {
    id: 'p4-seller',
    caseId: 'c4',
    role: 'seller',
    name: 'Feliciano Marasigan',
    civilStatus: 'Married',
    address: { municipality: 'Pila', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'yes', deed: 'yes', affidavit_retention: 'yes', spa: 'na' }),
    certs: certs(
      {
        municipal: { status: 'yes', validUntil: '2026-05-01' }, // expired
        provincial: { status: 'yes', validUntil: '2027-02-01' }
      },
      false
    ),
    landholding: {
      requestDate: '2025-10-02',
      expiryDate: '2026-06-02', // expired
      existingLandholding: '3.10 ha',
      toBeTransferred: '1.55 ha'
    }
  },
  {
    id: 'p4-buyer',
    caseId: 'c4',
    role: 'buyer',
    name: 'Divina Marasigan',
    civilStatus: 'Single',
    address: { municipality: 'Pila', province: 'Laguna' },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: docs({ title_td: 'na', deed: 'yes', affidavit_retention: 'na', spa: 'na' }),
    certs: certs({ municipal: { status: 'yes', validUntil: '2027-02-01' }, provincial: { status: 'yes', validUntil: '2027-02-01' } }, false),
    landholding: null
  }]

}];


// Next sequential control number suggestion for the current year.
export function suggestControlNumber(cases: Case[], year = 2026): string {
  const nums = cases.
  map((c) => c.controlNumber.match(/^(\d{4})-(\d{4})$/)).
  filter((m): m is RegExpMatchArray => Boolean(m) && Number(m![2]) === year).
  map((m) => Number(m[1]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${String(next).padStart(4, '0')}-${year}`;
}