import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import { CaseList } from './pages/CaseList';
import { NewCase } from './pages/NewCase';
import { CaseDetail } from './pages/CaseDetail';
import { HeirTree } from './pages/HeirTree';
import NewTransactionPage from './pages/NewTransactionPage';
import { supabase } from './lib/supabase';

// TEMP connection test — remove after verifying
supabase.from('cases').select('*').then(({ data, error }) => {
  if (error) console.error('SUPABASE ERROR:', error);
  else console.log('SUPABASE OK — rows:', data);
});

export function App() {
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
    </StoreProvider>);

}