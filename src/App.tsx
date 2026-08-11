import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import { CaseList } from './pages/CaseList';
import { NewCase } from './pages/NewCase';
import { CaseDetail } from './pages/CaseDetail';
import { HeirTree } from './pages/HeirTree';

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CaseList />} />
          <Route path="/case/new" element={<NewCase />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          <Route path="/case/:caseId/heirs" element={<HeirTree />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>);

}