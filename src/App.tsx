import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { StoreProvider } from "./store";
import { Login } from "./pages/Login";
import { CaseList } from "./pages/CaseList";
import { NewCase } from "./pages/NewCase";
import { CaseDetail } from "./pages/CaseDetail";
import { HeirTree } from "./pages/HeirTree";
import NewTransactionPage from "./pages/NewTransactionPage";

function AuthGate() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e9dfe5]">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CaseList />} />
          <Route path="/case/new" element={<NewCase />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          <Route path="/case/:caseId/heirs" element={<HeirTree />} />
          <Route path="/transaction/new" element={<NewTransactionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
