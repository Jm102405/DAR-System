import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchCases,
  insertCase,
  updateCertStatus,
  updateDeathCertType,
  updateDocumentStatus,
} from "./lib/cases";
import {
  Case,
  DeathCertType,
  DocumentKind,
  JurisdictionLevel,
  Party,
  TriState,
} from "./types";

interface StoreValue {
  cases: Case[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getCase: (caseId: string) => Case | undefined;
  addCase: (newCase: Case) => Promise<string>;
  cycleDocument: (caseId: string, partyId: string, kind: DocumentKind) => void;
  cycleCert: (
    caseId: string,
    partyId: string,
    level: JurisdictionLevel,
  ) => void;
  setDeathCert: (caseId: string, partyId: string, cert: DeathCertType) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const NEXT: Record<TriState, TriState> = {
  yes: "lacking",
  lacking: "na",
  na: "yes",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCases();
      setCases(rows);
    } catch (e: any) {
      console.error("Failed to load cases:", e);
      setError(e?.message ?? "Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const value = useMemo<StoreValue>(() => {
    const updateParty = (
      caseId: string,
      partyId: string,
      fn: (p: Party) => Party,
    ) => {
      setCases((prev) =>
        prev.map((c) =>
          c.caseId !== caseId
            ? c
            : {
                ...c,
                parties: c.parties.map((p) => (p.id === partyId ? fn(p) : p)),
              },
        ),
      );
    };

    const findParty = (caseId: string, partyId: string) =>
      cases
        .find((c) => c.caseId === caseId)
        ?.parties.find((p) => p.id === partyId);

    return {
      cases,
      loading,
      error,
      reload: load,
      getCase: (caseId) => cases.find((c) => c.caseId === caseId),
      addCase: async (newCase) => {
        const realId = await insertCase(newCase);
        await load();
        return realId;
      },

      cycleDocument: (caseId, partyId, kind) => {
        const current = findParty(caseId, partyId)?.documents.find(
          (d) => d.kind === kind,
        );
        if (!current) return;
        const next = NEXT[current.status];

        updateParty(caseId, partyId, (p) => ({
          ...p,
          documents: p.documents.map((d) =>
            d.kind === kind ? { ...d, status: next } : d,
          ),
        }));

        updateDocumentStatus(partyId, kind, next).catch((e) => {
          console.error("Failed to save document status:", e);
          load();
        });
      },

      cycleCert: (caseId, partyId, level) => {
        const current = findParty(caseId, partyId)?.certs.find(
          (c) => c.level === level,
        );
        if (!current) return;
        const next = NEXT[current.status];

        updateParty(caseId, partyId, (p) => ({
          ...p,
          certs: p.certs.map((cert) =>
            cert.level === level ? { ...cert, status: next } : cert,
          ),
        }));

        updateCertStatus(partyId, level, next).catch((e) => {
          console.error("Failed to save cert status:", e);
          load();
        });
      },

      setDeathCert: (caseId, partyId, cert) => {
        updateParty(caseId, partyId, (p) => ({ ...p, deathCertType: cert }));

        updateDeathCertType(partyId, cert).catch((e) => {
          console.error("Failed to save death cert type:", e);
          load();
        });
      },
    };
  }, [cases, loading, error]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
