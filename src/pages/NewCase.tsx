import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMonths, format, parseISO } from 'date-fns';
import { ArrowLeftIcon, InfoIcon } from 'lucide-react';
import { PhoneFrame } from '../components/PhoneFrame';
import {
  FormCard,
  SelectField,
  TextField,
  ToggleRow } from
'../components/FormControls';
import { useStore } from '../store';
import { suggestControlNumber } from '../data';
import {
  AssessorCert,
  Case,
  DeathCertType,
  DocumentKind,
  DocumentStatus,
  JurisdictionLevel,
  Party } from
'../types';

const TRANSACTION_TYPES = [
'EJS with DOAS',
'Deed of Absolute Sale',
'Deed of Donation',
'Extrajudicial Settlement',
'Deed of Exchange'] as
const;

type LevelChoice = 'municipality' | 'city';

const LEVEL_OPTIONS: {value: LevelChoice;label: string;}[] = [
{ value: 'municipality', label: 'Municipality' },
{ value: 'city', label: 'City' }];


const DEATH_CERT_OPTIONS: {value: DeathCertType;label: string;}[] = [
{ value: 'PSA', label: 'PSA' },
{ value: 'LCRO', label: 'LCRO' },
{ value: 'court order', label: 'Court order' }];


const DOC_ORDER: DocumentKind[] = ['title_td', 'deed', 'affidavit_retention', 'spa'];

interface PartyDraft {
  name: string;
  civilStatus: string;
  level: LevelChoice;
  locality: string;
  province: string;
}

const EMPTY_PARTY: PartyDraft = {
  name: '',
  civilStatus: 'Single',
  level: 'municipality',
  locality: '',
  province: ''
};

const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widow', 'Widower', 'Separated'].map((s) => ({
  value: s,
  label: s
}));

function blankDocuments(): DocumentStatus[] {
  return DOC_ORDER.map((kind) => ({ kind, status: 'lacking' }));
}

function blankCerts(isCity: boolean): AssessorCert[] {
  const levels: JurisdictionLevel[] = ['municipal', 'city', 'provincial'];
  return levels.map((level) => {
    const required = level === 'provincial' ? true : level === 'city' ? isCity : !isCity;
    return { level, required, status: required ? 'lacking' : 'na' };
  });
}

function toParty(
draft: PartyDraft,
base: {id: string;caseId: string;role: 'seller' | 'buyer';},
extras: Partial<Party> = {})
: Party {
  const isCity = draft.level === 'city';
  return {
    ...base,
    name: draft.name.trim(),
    civilStatus: draft.civilStatus,
    address: isCity ?
    { city: draft.locality.trim(), province: draft.province.trim() } :
    { municipality: draft.locality.trim(), province: draft.province.trim() },
    parentPartyId: null,
    heirGeneration: 0,
    isDeceased: false,
    deathCertType: null,
    documents: blankDocuments(),
    certs: blankCerts(isCity),
    landholding: null,
    ...extras
  };
}

export function NewCase() {
  const navigate = useNavigate();
  const { cases, addCase } = useStore();

  const today = format(new Date(), 'yyyy-MM-dd');
  const suggested = useMemo(
    () => suggestControlNumber(cases, new Date().getFullYear()),
    [cases]
  );

  const [controlNumber, setControlNumber] = useState(suggested);
  const [transactionType, setTransactionType] = useState<string>(TRANSACTION_TYPES[0]);
  const [dateOpened, setDateOpened] = useState(today);

  const [titleNo, setTitleNo] = useState('');
  const [tdNo, setTdNo] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [soldArea, setSoldArea] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');

  const [seller, setSeller] = useState<PartyDraft>(EMPTY_PARTY);
  const [sellerDeceased, setSellerDeceased] = useState(false);
  const [deathCert, setDeathCert] = useState<DeathCertType>('PSA');

  const [buyer, setBuyer] = useState<PartyDraft>(EMPTY_PARTY);

  const [requestDate, setRequestDate] = useState(today);
  const [existingLandholding, setExistingLandholding] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const expiryPreview = useMemo(() => {
    if (!requestDate) return null;
    try {
      return addMonths(parseISO(requestDate), 8);
    } catch {
      return null;
    }
  }, [requestDate]);

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!/^\d{4}-\d{4}$/.test(controlNumber.trim())) {
      next.controlNumber = 'Use the format NNNN-YYYY.';
    } else if (
    cases.some((c) => c.controlNumber === controlNumber.trim()))
    {
      next.controlNumber = 'This control number is already in use.';
    }
    if (!propertyAddress.trim()) next.propertyAddress = 'Property address is required.';
    if (!seller.name.trim()) next.sellerName = 'Seller name is required.';
    if (!seller.locality.trim()) next.sellerLocality = 'Required for certificate matching.';
    if (!seller.province.trim()) next.sellerProvince = 'Province is required.';
    if (!buyer.name.trim()) next.buyerName = 'Buyer name is required.';
    if (!buyer.locality.trim()) next.buyerLocality = 'Required for certificate matching.';
    if (!buyer.province.trim()) next.buyerProvince = 'Province is required.';
    if (!requestDate) next.requestDate = 'Landholding request date is required.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const caseId = `c-${Date.now()}`;
    const sellerParty = toParty(
      seller,
      { id: `${caseId}-seller`, caseId, role: 'seller' },
      {
        isDeceased: sellerDeceased,
        deathCertType: sellerDeceased ? deathCert : null,
        landholding: {
          requestDate,
          expiryDate: format(addMonths(parseISO(requestDate), 8), 'yyyy-MM-dd'),
          existingLandholding: existingLandholding.trim() || totalArea.trim(),
          toBeTransferred: soldArea.trim()
        }
      }
    );
    const buyerParty = toParty(buyer, { id: `${caseId}-buyer`, caseId, role: 'buyer' });

    const newCase: Case = {
      caseId,
      controlNumber: controlNumber.trim(),
      transactionType,
      dateOpened,
      property: {
        caseId,
        titleNo: titleNo.trim() || '—',
        tdNo: tdNo.trim() || '—',
        totalArea: totalArea.trim() || '—',
        soldArea: soldArea.trim() || '—',
        lotNo: lotNo.trim() || '—',
        address: propertyAddress.trim()
      },
      parties: [sellerParty, buyerParty]
    };

    setSaving(true);
    try {
      const realId = await addCase(newCase);
      navigate(`/case/${realId}`);
    } catch (err: any) {
      console.error('Failed to save case:', err);
      setErrors({ submit: err?.message ?? 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PhoneFrame>
      <header className="bg-ink px-5 pb-6 pt-6 text-white md:px-8 md:pb-7 md:pt-8 xl:px-10">
        <div className="mx-auto flex max-w-[1240px] items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to case list"
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gold-soft transition-colors active:bg-white/10">
            
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft/80">
              New intake
            </p>
            <h1 className="mt-1 font-serif text-xl font-semibold leading-tight md:text-2xl">
              Create transaction
            </h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="no-scrollbar flex-1 overflow-y-auto bg-[#e9dfe5]">
        <div className="mx-auto max-w-[1240px] p-4 md:p-6 xl:p-8">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
            {/* Transaction */}
            <FormCard
              title="Transaction"
              hint="Control number is auto-suggested as the next sequential number for this year.">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="control-number"
                  label="Control no."
                  required
                  value={controlNumber}
                  onChange={setControlNumber}
                  placeholder="0009-2026"
                  error={errors.controlNumber} />
                
                <TextField
                  id="date-opened"
                  label="Date opened"
                  type="date"
                  value={dateOpened}
                  onChange={setDateOpened} />
                
                <div className="sm:col-span-2">
                  <SelectField
                    id="transaction-type"
                    label="Transaction type"
                    value={transactionType}
                    onChange={setTransactionType}
                    options={TRANSACTION_TYPES.map((t) => ({ value: t, label: t }))} />
                  
                </div>
              </div>
            </FormCard>

            {/* Property */}
            <FormCard title="Property">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="title-no"
                  label="Title no."
                  value={titleNo}
                  onChange={setTitleNo}
                  placeholder="OCT-4471" />
                
                <TextField
                  id="td-no"
                  label="TD no."
                  value={tdNo}
                  onChange={setTdNo}
                  placeholder="TD-2026-00123" />
                
                <TextField
                  id="lot-no"
                  label="Lot no."
                  value={lotNo}
                  onChange={setLotNo}
                  placeholder="Lot 1123, Pls-231" />
                
                <TextField
                  id="total-area"
                  label="Total area"
                  value={totalArea}
                  onChange={setTotalArea}
                  placeholder="2.40 ha" />
                
                <TextField
                  id="sold-area"
                  label="Area to transfer"
                  value={soldArea}
                  onChange={setSoldArea}
                  placeholder="1.10 ha" />
                
                <TextField
                  id="property-address"
                  label="Property address"
                  required
                  value={propertyAddress}
                  onChange={setPropertyAddress}
                  placeholder="Brgy. Malaya, Sta. Cruz, Laguna"
                  error={errors.propertyAddress} />
                
              </div>
            </FormCard>

            {/* Seller */}
            <FormCard
              title="Seller / owner"
              hint="The original owner is always recorded as the seller. Heirs can be added after intake.">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="seller-name"
                  label="Full name"
                  required
                  value={seller.name}
                  onChange={(v) => setSeller({ ...seller, name: v })}
                  placeholder="Eduardo Villaraza"
                  error={errors.sellerName} />
                
                <SelectField
                  id="seller-civil"
                  label="Civil status"
                  value={seller.civilStatus}
                  onChange={(v) => setSeller({ ...seller, civilStatus: v })}
                  options={CIVIL_STATUS_OPTIONS} />
                
                <SelectField
                  id="seller-level"
                  label="Jurisdiction"
                  value={seller.level}
                  onChange={(v) => setSeller({ ...seller, level: v })}
                  options={LEVEL_OPTIONS} />
                
                <TextField
                  id="seller-locality"
                  label={seller.level === 'city' ? 'City' : 'Municipality'}
                  required
                  value={seller.locality}
                  onChange={(v) => setSeller({ ...seller, locality: v })}
                  placeholder={seller.level === 'city' ? 'Calamba' : 'Sta. Cruz'}
                  error={errors.sellerLocality} />
                
                <TextField
                  id="seller-province"
                  label="Province"
                  required
                  value={seller.province}
                  onChange={(v) => setSeller({ ...seller, province: v })}
                  placeholder="Laguna"
                  error={errors.sellerProvince} />
                
                <div className="sm:col-span-2">
                  <ToggleRow
                    label="Seller is deceased"
                    description="Requires a death certificate and heir entries."
                    checked={sellerDeceased}
                    onChange={setSellerDeceased} />
                  
                </div>
                {sellerDeceased &&
                <div className="sm:col-span-2">
                    <SelectField
                    id="death-cert"
                    label="Death certificate type"
                    required
                    value={deathCert}
                    onChange={setDeathCert}
                    options={DEATH_CERT_OPTIONS}
                    hint="Heirs can be recorded from the case's heir tree once the case is open." />
                  
                  </div>
                }
              </div>
            </FormCard>

            {/* Buyer */}
            <FormCard
              title="Buyer / transferee"
              hint="The buyer's address determines their required assessor certifications.">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="buyer-name"
                  label="Full name"
                  required
                  value={buyer.name}
                  onChange={(v) => setBuyer({ ...buyer, name: v })}
                  placeholder="Grace Ann Delfin"
                  error={errors.buyerName} />
                
                <SelectField
                  id="buyer-civil"
                  label="Civil status"
                  value={buyer.civilStatus}
                  onChange={(v) => setBuyer({ ...buyer, civilStatus: v })}
                  options={CIVIL_STATUS_OPTIONS} />
                
                <SelectField
                  id="buyer-level"
                  label="Jurisdiction"
                  value={buyer.level}
                  onChange={(v) => setBuyer({ ...buyer, level: v })}
                  options={LEVEL_OPTIONS} />
                
                <TextField
                  id="buyer-locality"
                  label={buyer.level === 'city' ? 'City' : 'Municipality'}
                  required
                  value={buyer.locality}
                  onChange={(v) => setBuyer({ ...buyer, locality: v })}
                  placeholder={buyer.level === 'city' ? 'San Pablo' : 'Nagcarlan'}
                  error={errors.buyerLocality} />
                
                <TextField
                  id="buyer-province"
                  label="Province"
                  required
                  value={buyer.province}
                  onChange={(v) => setBuyer({ ...buyer, province: v })}
                  placeholder="Laguna"
                  error={errors.buyerProvince} />
                
              </div>
            </FormCard>

            {/* Landholding */}
            <FormCard
              title="Landholding request"
              hint="Validity runs 8 months from the request date and is flagged 30 days before expiry.">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="request-date"
                  label="Request date"
                  type="date"
                  required
                  value={requestDate}
                  onChange={setRequestDate}
                  error={errors.requestDate} />
                
                <TextField
                  id="existing-landholding"
                  label="Existing landholding"
                  value={existingLandholding}
                  onChange={setExistingLandholding}
                  placeholder="2.40 ha" />
                
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-gold/10 px-3.5 py-3">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs leading-5 text-ink/80">
                  Expires{' '}
                  <span className="font-semibold">
                    {expiryPreview ? format(expiryPreview, 'MMM d, yyyy') : '—'}
                  </span>
                  . All documents and certificates start as <span className="font-semibold">Lacking</span>{' '}
                  and can be cycled on the case screen.
                </p>
              </div>
            </FormCard>
          </div>

          {errors.submit &&
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.submit}
            </div>
          }

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-xl border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors active:bg-black/[0.03]">
              
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-light active:bg-ink-dark disabled:opacity-50">
              
              {saving ? 'Saving…' : 'Create transaction'}
            </button>
          </div>
        </div>
      </form>
    </PhoneFrame>);

}