import React from 'react';
import { AlertTriangleIcon, CheckIcon, ClockIcon } from 'lucide-react';
import { CaseEval, statusTokens } from '../utils';

export function StatusBadge({ evalResult }: {evalResult: CaseEval;}) {
  const tokens = statusTokens(evalResult.status);

  let label: string;
  let Icon = AlertTriangleIcon;
  if (evalResult.status === 'ready') {
    label = 'Ready';
    Icon = CheckIcon;
  } else if (evalResult.status === 'expired') {
    label = 'Expired';
    Icon = AlertTriangleIcon;
  } else if (evalResult.status === 'expiring') {
    const d = evalResult.soonestExpiryDays ?? 0;
    label = `${Math.max(d, 0)} day${d === 1 ? '' : 's'} left`;
    Icon = ClockIcon;
  } else {
    label = `${evalResult.attentionCount} lacking`;
    Icon = AlertTriangleIcon;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${tokens.badgeBg} ${tokens.badgeText} ${tokens.badgeBorder}`}>
      
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </span>);

}