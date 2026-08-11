import React from 'react';

export function PhoneFrame({ children }: {children: React.ReactNode;}) {
  return (
    <div className="min-h-full w-full bg-[#e9dfe5] p-0 md:p-5 xl:p-8">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col overflow-hidden bg-canvas md:min-h-[calc(100vh-40px)] md:rounded-2xl md:border md:border-ink/10 xl:min-h-[calc(100vh-64px)]">
        {children}
      </div>
    </div>);

}