import { CheckIcon, ClockIcon, MinusIcon } from 'lucide-react';
import { AssessorCert, JURISDICTION_LABELS } from '../types';
import { validityFromExpiry } from '../utils';

export function CertChip({ cert, onTap }: {cert: AssessorCert;onTap: () => void;}) {
  const label = JURISDICTION_LABELS[cert.level];

  if (!cert.required) {
    return (
      <button
        type="button"
        onClick={onTap}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-neutral-soft px-2.5 py-1.5 text-xs font-medium text-gray-400">
        
        <MinusIcon className="h-3.5 w-3.5" />
        {label}
      </button>);

  }

  let classes = 'border-danger-border bg-danger-soft text-danger';
  let Icon = MinusIcon;

  if (cert.status === 'yes') {
    const v = validityFromExpiry(cert.validUntil);
    if (v === 'expired') {
      classes = 'border-danger-border bg-danger-soft text-danger-strong';
      Icon = ClockIcon;
    } else if (v === 'expiring') {
      classes = 'border-warning-border bg-warning-soft text-warning';
      Icon = ClockIcon;
    } else {
      classes = 'border-success-border bg-success-soft text-success';
      Icon = CheckIcon;
    }
  } else if (cert.status === 'na') {
    classes = 'border-gray-200 bg-neutral-soft text-gray-400';
    Icon = MinusIcon;
  }

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`${label} assessor certification: ${cert.status}. Tap to change`}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors active:scale-[0.97] ${classes}`}>
      
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </button>);

}