'use client';

import { AuthProvider } from '@/context/AuthContext';
import { AnalysisDialogProvider } from '@/context/AnalysisDialogContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalysisDialogProvider>
        {children}
      </AnalysisDialogProvider>
    </AuthProvider>
  );
} 