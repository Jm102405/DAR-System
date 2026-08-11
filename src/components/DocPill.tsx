import React from 'react';
import { TriState } from '../types';

interface DocPillProps {
  status: TriState;
  onCycle: () => void;
  label: string;
}

const STYLES: Record<TriState, {text: string;classes: string;}> = {
  yes: {
    text: 'Yes',
    classes: 'bg-success-soft text-success border-success-border'
  },
  lacking: {
    text: 'Lacking',
    classes: 'bg-danger-soft text-danger border-danger-border'
  },
  na: {
    text: 'N/A',
    classes: 'bg-neutral-soft text-gray-500 border-gray-200'
  }
};

export function DocPill({ status, onCycle, label }: DocPillProps) {
  const s = STYLES[status];
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`${label}: ${s.text}. Tap to change`}
      className={`min-w-[76px] rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors active:scale-[0.97] ${s.classes}`}>
      
      {s.text}
    </button>);

}