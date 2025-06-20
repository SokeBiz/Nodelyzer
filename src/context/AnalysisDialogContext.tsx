import { createContext, useContext, useState, ReactNode } from "react";

interface DialogContext {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const AnalysisDialogContext = createContext<DialogContext | undefined>(undefined);

export function AnalysisDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);
  return (
    <AnalysisDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
      {children}
    </AnalysisDialogContext.Provider>
  );
}

export function useAnalysisDialog() {
  const ctx = useContext(AnalysisDialogContext);
  if (!ctx) {
    throw new Error("useAnalysisDialog must be used within AnalysisDialogProvider");
  }
  return ctx;
} 