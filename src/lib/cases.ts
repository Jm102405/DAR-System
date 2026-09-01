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

// Insert a full case (case + property + parties + documents + certs).
// Returns the real database UUID of the new case.
export async function insertCase(newCase: Case): Promise<string> {
  // 1. Case row
  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .insert({
      control_number: newCase.controlNumber,
      transaction_type: newCase.transactionType,
      date_opened: newCase.dateOpened,
    })
    .select("id")
    .single();

  if (caseErr) throw caseErr;
  const caseId = caseRow.id as string;

  // 2. Property row
  const p = newCase.property;
  const { error: propErr } = await supabase.from("properties").insert({
    case_id: caseId,
    title_no: p.titleNo,
    td_no: p.tdNo,
    total_area: p.totalArea,
    sold_area: p.soldArea,
    lot_no: p.lotNo,
    address: p.address,
  });

  if (propErr) throw propErr;

  // 3. Party rows
  const { data: partyRows, error: partyErr } = await supabase
    .from("parties")
    .insert(
      newCase.parties.map((party) => ({
        case_id: caseId,
        role: party.role,
        name: party.name,
        civil_status: party.civilStatus,
        municipality: party.address.municipality ?? null,
        city: party.address.city ?? null,
        province: party.address.province,
        heir_generation: party.heirGeneration,
        is_deceased: party.isDeceased,
        death_cert_type: party.deathCertType,
        landholding_request_date: party.landholding?.requestDate ?? null,
        landholding_expiry_date: party.landholding?.expiryDate ?? null,
        existing_landholding: party.landholding?.existingLandholding ?? null,
        to_be_transferred: party.landholding?.toBeTransferred ?? null,
      })),
    )
    .select("id, name");

  if (partyErr) throw partyErr;

  // Map each draft party to its new database id by name.
  const idByName = new Map<string, string>();
  (partyRows ?? []).forEach((row: any) => idByName.set(row.name, row.id));

  // 4. Documents
  const docs = newCase.parties.flatMap((party) => {
    const dbId = idByName.get(party.name);
    if (!dbId) return [];
    return party.documents.map((d) => ({
      party_id: dbId,
      kind: d.kind,
      status: d.status,
    }));
  });

  if (docs.length) {
    const { error } = await supabase.from("party_documents").insert(docs);
    if (error) throw error;
  }

  // 5. Certificates
  const certs = newCase.parties.flatMap((party) => {
    const dbId = idByName.get(party.name);
    if (!dbId) return [];
    return party.certs.map((c) => ({
      party_id: dbId,
      level: c.level,
      required: c.required,
      status: c.status,
      cert_no: c.certNo ?? null,
      date_issued: c.dateIssued ?? null,
      valid_until: c.validUntil ?? null,
    }));
  });

  if (certs.length) {
    const { error } = await supabase.from("party_certs").insert(certs);
    if (error) throw error;
  }

  return caseId;
}
