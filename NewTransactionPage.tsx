import { useState, Fragment, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, Check, Plus, X } from "lucide-react";

const colors = {
  headerBg: "#341022",
  headerBgLight: "#432038",
  gold: "#C9A96A",
  goldDark: "#A9823C",
  pageBg: "#ECE2E3",
  cardBg: "#FFFFFF",
  ink: "#2B2622",
  inkMuted: "#8B8580",
  border: "#E7DCD9",
  amberBg: "#FCF1DC",
  amberText: "#A9761B",
  greenBg: "#E3F3E7",
  greenText: "#2F7D57",
  sellerAvatar: "#8A3B32",
  buyerAvatar: "#2C7A63",
} as const;

interface Heir {
  id: number;
  name: string;
  relationship: string;
  address: string;
  deceased: boolean;
}

interface Party {
  id: number;
  name: string;
  status: string;
  address: string;
  deceased: boolean;
  heirs: Heir[];
}

interface PropertyDetails {
  ownerName: string;
  titleNo: string;
  tdNo: string;
  lotNo: string;
  area: string;
  areaApplied: string;
  transactionType: string;
  barangay: string;
  city: string;
  province: string;
}

type FieldChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement>;

let idSeq = 1;
const nextId = (): number => idSeq++;

function getInitials(name: string): string {
  if (!name || !name.trim()) return "—";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function emptyParty(): Party {
  return { id: nextId(), name: "", status: "", address: "", deceased: false, heirs: [] };
}
function emptyHeir(): Heir {
  return { id: nextId(), name: "", relationship: "", address: "", deceased: false };
}

const inputStyle = { border: `1px solid ${colors.border}`, color: colors.ink };
const inputClass =
  "w-full rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-offset-0 transition-shadow";

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span
        className="block text-xs font-semibold tracking-wide uppercase mb-1.5"
        style={{ color: colors.inkMuted }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

interface SectionHeaderProps {
  number: string;
  title: string;
  onAdd?: () => void;
  addLabel?: string;
}

function SectionHeader({ number, title, onAdd, addLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold" style={{ color: colors.goldDark }}>
          {number}
        </span>
        <h2
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: colors.goldDark }}
        >
          {title}
        </h2>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5"
          style={{ color: colors.goldDark, border: `1px solid ${colors.border}` }}
        >
          <Plus size={13} />
          {addLabel}
        </button>
      )}
    </div>
  );
}

interface HeirRowProps {
  heir: Heir;
  onChange: (heir: Heir) => void;
  onRemove: () => void;
}

function HeirRow({ heir, onChange, onRemove }: HeirRowProps) {
  return (
    <div className="rounded-lg p-3 bg-white" style={{ border: `1px solid ${colors.border}` }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input
            className={inputClass}
            style={inputStyle}
            placeholder="Heir's name"
            value={heir.name}
            onChange={(e: FieldChangeEvent) => onChange({ ...heir, name: e.target.value })}
          />
          <input
            className={inputClass}
            style={inputStyle}
            placeholder="Relationship (e.g. Son)"
            value={heir.relationship}
            onChange={(e: FieldChangeEvent) => onChange({ ...heir, relationship: e.target.value })}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded mt-0.5"
          style={{ color: colors.inkMuted }}
          aria-label="Remove heir"
        >
          <X size={14} />
        </button>
      </div>
      <input
        className={inputClass + " mt-2"}
        style={inputStyle}
        placeholder="Address"
        value={heir.address}
        onChange={(e: FieldChangeEvent) => onChange({ ...heir, address: e.target.value })}
      />
      <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={heir.deceased}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...heir, deceased: e.target.checked })}
          className="w-3.5 h-3.5 rounded"
        />
        <span className="text-xs" style={{ color: colors.ink }}>
          This heir is also deceased
        </span>
      </label>
      {heir.deceased && (
        <p
          className="text-xs rounded-lg px-2.5 py-1.5 mt-2"
          style={{ backgroundColor: colors.amberBg, color: colors.amberText }}
        >
          Their heirs can be added from the full heir tree once this case is created.
        </p>
      )}
    </div>
  );
}

interface PartyCardProps {
  party: Party;
  avatarColor: string;
  roleLabel: string;
  namePlaceholder: string;
  onChange: (party: Party) => void;
  onRemove: () => void;
  removable: boolean;
}

function PartyCard({
  party,
  avatarColor,
  roleLabel,
  namePlaceholder,
  onChange,
  onRemove,
  removable,
}: PartyCardProps) {
  const set = (field: keyof Party) => (e: FieldChangeEvent) =>
    onChange({ ...party, [field]: e.target.value });

  const toggleDeceased = (e: ChangeEvent<HTMLInputElement>) => {
    const deceased = e.target.checked;
    onChange({ ...party, deceased, heirs: deceased ? party.heirs : [] });
  };
  const addHeir = () => onChange({ ...party, heirs: [...party.heirs, emptyHeir()] });
  const updateHeir = (heirId: number, next: Heir) =>
    onChange({ ...party, heirs: party.heirs.map((h) => (h.id === heirId ? next : h)) });
  const removeHeir = (heirId: number) =>
    onChange({ ...party, heirs: party.heirs.filter((h) => h.id !== heirId) });

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(party.name)}
          </div>
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: colors.inkMuted }}>
            {roleLabel}
          </span>
        </div>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded"
            style={{ color: colors.inkMuted }}
            aria-label="Remove"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <Field label="Full name">
          <input
            className={inputClass}
            style={inputStyle}
            placeholder={namePlaceholder}
            value={party.name}
            onChange={set("name")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Civil status">
            <select className={inputClass} style={inputStyle} value={party.status} onChange={set("status")}>
              <option value="">Select</option>
              <option>Single</option>
              <option>Married</option>
              <option>Widowed</option>
              <option>Separated</option>
            </select>
          </Field>
          <Field label="Address">
            <input
              className={inputClass}
              style={inputStyle}
              placeholder="City, Province"
              value={party.address}
              onChange={set("address")}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
          <input type="checkbox" checked={party.deceased} onChange={toggleDeceased} className="w-4 h-4 rounded" />
          <span className="text-sm" style={{ color: colors.ink }}>
            {roleLabel} is deceased
          </span>
        </label>

        {party.deceased && (
          <div className="rounded-xl p-4 mt-1" style={{ backgroundColor: colors.pageBg }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: colors.goldDark }}>
                Heirs
              </span>
              <button
                type="button"
                onClick={addHeir}
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: colors.goldDark }}
              >
                <Plus size={13} /> Add heir
              </button>
            </div>
            {party.heirs.length === 0 && (
              <p className="text-xs" style={{ color: colors.inkMuted }}>
                No heirs added yet.
              </p>
            )}
            <div className="space-y-3">
              {party.heirs.map((heir) => (
                <HeirRow
                  key={heir.id}
                  heir={heir}
                  onChange={(next) => updateHeir(heir.id, next)}
                  onRemove={() => removeHeir(heir.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewTransactionPage() {
  const [property, setProperty] = useState<PropertyDetails>({
    ownerName: "",
    titleNo: "",
    tdNo: "",
    lotNo: "",
    area: "",
    areaApplied: "",
    transactionType: "",
    barangay: "",
    city: "",
    province: "",
  });
  const [sellers, setSellers] = useState<Party[]>([emptyParty()]);
  const [buyers, setBuyers] = useState<Party[]>([emptyParty()]);
  const [saved, setSaved] = useState(false);

  const controlNo = "0009-2026";
  const setP = (field: keyof PropertyDetails) => (e: FieldChangeEvent) =>
    setProperty((s) => ({ ...s, [field]: e.target.value }));

  const updateAt = (setter: React.Dispatch<React.SetStateAction<Party[]>>) => (id: number, next: Party) =>
    setter((list) => list.map((p) => (p.id === id ? next : p)));
  const removeAt = (setter: React.Dispatch<React.SetStateAction<Party[]>>) => (id: number) =>
    setter((list) => list.filter((p) => p.id !== id));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  return (
    <Fragment>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-full" style={{ backgroundColor: colors.pageBg }}>
        {/* Header */}
        <div className="px-6 sm:px-10 py-8" style={{ backgroundColor: colors.headerBg }}>
          <div className="flex items-start justify-between max-w-5xl mx-auto gap-4">
            <div className="flex items-start gap-4">
              <button type="button" className="mt-1.5 rounded-lg p-1.5" style={{ color: colors.gold }} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: colors.gold }}>
                  New case
                </div>
                <h1
                  className="text-3xl leading-tight mb-1"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#F7EFE9" }}
                >
                  New transaction
                </h1>
                <p className="text-sm" style={{ color: "#C9B8BE" }}>
                  Add property, seller, and buyer details to start a case
                </p>
              </div>
            </div>
            <div
              className="rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap"
              style={{ backgroundColor: colors.headerBgLight, color: "#C9B8BE" }}
            >
              Draft · {controlNo}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 sm:px-10 py-8 space-y-8">
          {saved && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: colors.greenBg, color: colors.greenText }}
            >
              <Check size={16} />
              Case {controlNo} created with {sellers.length} seller(s) and {buyers.length} buyer(s).
            </div>
          )}

          {/* Section 1: Property */}
          <section>
            <SectionHeader number="01" title="Property details" />
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
            >
              <div className="mb-5">
                <Field label="Owner's name (as titled)">
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Eduardo Villaraza, or multiple names separated by ;"
                    value={property.ownerName}
                    onChange={setP("ownerName")}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <Field label="Title no.">
                  <input className={inputClass} style={inputStyle} placeholder="T-00312" value={property.titleNo} onChange={setP("titleNo")} />
                </Field>
                <Field label="Tax declaration no.">
                  <input className={inputClass} style={inputStyle} placeholder="TD-2026-00123" value={property.tdNo} onChange={setP("tdNo")} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <Field label="Lot no.">
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Lot 1123, Pls-231"
                    value={property.lotNo}
                    onChange={setP("lotNo")}
                  />
                </Field>
                <Field label="Transaction type">
                  <select className={inputClass} style={inputStyle} value={property.transactionType} onChange={setP("transactionType")}>
                    <option value="">Select type</option>
                    <option>Deed of sale</option>
                    <option>Deed of donation</option>
                    <option>Extra-judicial settlement (EJS)</option>
                    <option>EJS with deed of absolute sale</option>
                    <option>Deed of exchange</option>
                    <option>Other</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <Field label="Total area">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      style={inputStyle}
                      placeholder="0.00"
                      value={property.area}
                      onChange={setP("area")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: colors.inkMuted }}>
                      ha
                    </span>
                  </div>
                </Field>
                <Field label="Area applied">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      style={inputStyle}
                      placeholder="0.00"
                      value={property.areaApplied}
                      onChange={setP("areaApplied")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: colors.inkMuted }}>
                      ha
                    </span>
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="Barangay">
                  <input className={inputClass} style={inputStyle} placeholder="Brgy. Malaya" value={property.barangay} onChange={setP("barangay")} />
                </Field>
                <Field label="City / municipality">
                  <input className={inputClass} style={inputStyle} placeholder="Sta. Cruz" value={property.city} onChange={setP("city")} />
                </Field>
                <Field label="Province">
                  <input className={inputClass} style={inputStyle} placeholder="Laguna" value={property.province} onChange={setP("province")} />
                </Field>
              </div>
            </div>
          </section>

          {/* Section 2: Sellers */}
          <section>
            <SectionHeader
              number="02"
              title="Sellers / transferors"
              onAdd={() => setSellers((s) => [...s, emptyParty()])}
              addLabel="Add seller"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {sellers.map((seller) => (
                <PartyCard
                  key={seller.id}
                  party={seller}
                  avatarColor={colors.sellerAvatar}
                  roleLabel="Seller / transferor"
                  namePlaceholder="Eduardo Villaraza"
                  onChange={(next) => updateAt(setSellers)(seller.id, next)}
                  onRemove={() => removeAt(setSellers)(seller.id)}
                  removable={sellers.length > 1}
                />
              ))}
            </div>
          </section>

          {/* Section 3: Buyers */}
          <section>
            <SectionHeader
              number="03"
              title="Buyers / transferees"
              onAdd={() => setBuyers((s) => [...s, emptyParty()])}
              addLabel="Add buyer"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {buyers.map((buyer) => (
                <PartyCard
                  key={buyer.id}
                  party={buyer}
                  avatarColor={colors.buyerAvatar}
                  roleLabel="Buyer / transferee"
                  namePlaceholder="Grace Ann Delfin"
                  onChange={(next) => updateAt(setBuyers)(buyer.id, next)}
                  onRemove={() => removeAt(setBuyers)(buyer.id)}
                  removable={buyers.length > 1}
                />
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="text-sm font-medium px-4 py-2.5" style={{ color: colors.inkMuted }}>
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.headerBg }}
            >
              Create case
            </button>
          </div>
        </form>
      </div>
    </Fragment>
  );
}
