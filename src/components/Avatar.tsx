import React from 'react';
import { initials, PartyStatus, statusTokens } from '../utils';

interface AvatarProps {
  name: string;
  status: PartyStatus;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base'
};

export function Avatar({ name, status, size = 'md' }: AvatarProps) {
  const tokens = statusTokens(status);
  return (
    <div
      className={`${SIZES[size]} ${tokens.avatarBg} flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide text-white`}
      aria-hidden="true">
      
      {initials(name)}
    </div>);

}