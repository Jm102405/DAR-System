// ---- Domain types for the DAR clearance tracker ----

export type TriState = 'yes' | 'lacking' | 'na';

export type ValidityStatus = 'valid' | 'expiring' | 'expired' | 'none';

export type DeathCertType = 'PSA' | 'LCRO' | 'court order';

export type DocumentKind = 'title_td' | 'deed' | 'affidavit_retention' | 'spa';

export type JurisdictionLevel = 'municipal' | 'city' | 'provincial';

export type PartyRole = 'seller' | 'buyer';

export interface Address {
  municipality?: string; // municipality OR city (one applies)
  city?: string;
  province: string;
}

export interface DocumentStatus {
  kind: DocumentKind;
  status: TriState;
  dateSubmitted?: string;
}

export interface AssessorCert {
  level: JurisdictionLevel;
  required: boolean; // determined by address (jurisdiction matching)
  status: TriState; // yes = on file & valid, lacking, na
  certNo?: string;
  dateIssued?: string;
  validUntil?: string; // certs expire too
}

export interface LandholdingRecord {
  requestDate: string; // ISO
  expiryDate: string; // requestDate + 8 months
  existingLandholding?: string;
  toBeTransferred?: string;
}

export interface Party {
  id: string;
  caseId: string;
  role: PartyRole;
  name: string;
  civilStatus: string;
  address: Address;
  parentPartyId: string | null;
  heirGeneration: number; // 0 for original party
  isDeceased: boolean;
  deathCertType: DeathCertType | null;
  documents: DocumentStatus[];
  certs: AssessorCert[];
  landholding: LandholdingRecord | null;
}

export interface Property {
  caseId: string;
  titleNo: string;
  tdNo: string;
  totalArea: string;
  soldArea: string;
  lotNo: string;
  address: string;
}

export interface Case {
  caseId: string;
  controlNumber: string; // NNNN-YYYY
  transactionType: string;
  dateOpened: string;
  property: Property;
  parties: Party[]; // flat list, tree derived via parentPartyId
}

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  title_td: 'Title / TD',
  deed: 'Deed',
  affidavit_retention: 'Affidavit of retention',
  spa: 'SPA'
};

export const JURISDICTION_LABELS: Record<JurisdictionLevel, string> = {
  municipal: 'Municipal',
  city: 'City',
  provincial: 'Provincial'
};