import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCases } from "./lib/cases";
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
  addCase: (newCase: Case) => void;
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

    return {
      cases,
      loading,
      error,
      reload: load,
      getCase: (caseId) => cases.find((c) => c.caseId === caseId),
      addCase: (newCase) => setCases((prev) => [newCase, ...prev]),
      cycleDocument: (caseId, partyId, kind) =>
        updateParty(caseId, partyId, (p) => ({
          ...p,
          documents: p.documents.map((d) =>
            d.kind === kind ? { ...d, status: NEXT[d.status] } : d,
          ),
        })),
      cycleCert: (caseId, partyId, level) =>
        updateParty(caseId, partyId, (p) => ({
          ...p,
          certs: p.certs.map((cert) =>
            cert.level === level
              ? { ...cert, status: NEXT[cert.status] }
              : cert,
          ),
        })),
      setDeathCert: (caseId, partyId, cert) =>
        updateParty(caseId, partyId, (p) => ({ ...p, deathCertType: cert })),
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
