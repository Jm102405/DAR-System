import { LandholdingRecord } from '../types';
import { fmtDate, humanRemaining, landholdingProgress, validityFromExpiry } from '../utils';

export function ValidityBar({ record }: {record: LandholdingRecord;}) {
  const status = validityFromExpiry(record.expiryDate);
  const progress = landholdingProgress(record);
  const expired = status === 'expired';

  const barColor =
  status === 'expired' ?
  'bg-danger-strong' :
  status === 'expiring' ?
  'bg-warning' :
  'bg-success';

  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-soft">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.round(progress * 100)}%` }} />
        
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="text-xs text-gray-500">
          Filed {fmtDate(record.requestDate)} · expires {fmtDate(record.expiryDate)}
        </p>
        <p
          className={`shrink-0 text-xs font-semibold ${
          expired ?
          'text-danger-strong' :
          status === 'expiring' ?
          'text-warning' :
          'text-success'}`
          }>
          
          {humanRemaining(record.expiryDate)}
        </p>
      </div>
    </div>);

}