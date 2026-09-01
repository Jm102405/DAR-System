import { supabase } from "./supabase";
import { Case, Party } from "../types";

// Fetch all cases with their property, parties, documents and certs.
export async function fetchCases(): Promise<Case[]> {
  const { data, error } = await supabase
    .from("cases")
    .select(
      `
      id,
      control_number,
      transaction_type,
      date_opened,
      properties (
        title_no, td_no, total_area, sold_area, lot_no, address
      ),
      parties (
        id, role, name, civil_status,
        municipality, city, province,
        parent_party_id, heir_generation,
        is_deceased, death_cert_type,
        landholding_request_date, landholding_expiry_date,
        existing_landholding, to_be_transferred,
        party_documents ( kind, status, date_submitted ),
        party_certs ( level, required, status, cert_no, date_issued, valid_until )
      )
    `,
    )
    .order("date_opened", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapCase);
}

function mapCase(row: any): Case {
  const prop = Array.isArray(row.properties)
    ? row.properties[0]
    : row.properties;

  return {
    caseId: row.id,
    controlNumber: row.control_number,
    transactionType: row.transaction_type,
    dateOpened: row.date_opened,
    property: {
      caseId: row.id,
      titleNo: prop?.title_no ?? "",
      tdNo: prop?.td_no ?? "",
      totalArea: prop?.total_area ?? "",
      soldArea: prop?.sold_area ?? "",
      lotNo: prop?.lot_no ?? "",
      address: prop?.address ?? "",
    },
    parties: (row.parties ?? []).map((p: any) => mapParty(p, row.id)),
  };
}

function mapParty(p: any, caseId: string): Party {
  return {
    id: p.id,
    caseId,
    role: p.role,
    name: p.name,
    civilStatus: p.civil_status ?? "",
    address: {
      municipality: p.municipality ?? undefined,
      city: p.city ?? undefined,
      province: p.province,
    },
    parentPartyId: p.parent_party_id,
    heirGeneration: p.heir_generation,
    isDeceased: p.is_deceased,
    deathCertType: p.death_cert_type,
    documents: (p.party_documents ?? []).map((d: any) => ({
      kind: d.kind,
      status: d.status,
      dateSubmitted: d.date_submitted ?? undefined,
    })),
    certs: (p.party_certs ?? []).map((c: any) => ({
      level: c.level,
      required: c.required,
      status: c.status,
      certNo: c.cert_no ?? undefined,
      dateIssued: c.date_issued ?? undefined,
      validUntil: c.valid_until ?? undefined,
    })),
    landholding: p.landholding_request_date
      ? {
          requestDate: p.landholding_request_date,
          expiryDate: p.landholding_expiry_date,
          existingLandholding: p.existing_landholding ?? undefined,
          toBeTransferred: p.to_be_transferred ?? undefined,
        }
      : null,
  };
}

// ---- Writes ----

export async function updateDocumentStatus(
  partyId: string,
  kind: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from("party_documents")
    .update({ status })
    .eq("party_id", partyId)
    .eq("kind", kind);

  if (error) throw error;
}

export async function updateCertStatus(
  partyId: string,
  level: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from("party_certs")
    .update({ status })
    .eq("party_id", partyId)
    .eq("level", level);

  if (error) throw error;
}

export async function updateDeathCertType(
  partyId: string,
  deathCertType: string,
): Promise<void> {
  const { error } = await supabase
    .from("parties")
    .update({ death_cert_type: deathCertType })
    .eq("id", partyId);

  if (error) throw error;
}
