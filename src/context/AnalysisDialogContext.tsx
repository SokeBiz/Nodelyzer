import { createContext, useContext, useState, ReactNode } from "react";

interface DialogContext {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  dismissDialog: () => void;
}

const STORAGE_KEY = "nodelyzer_analysis_dialog_dismissed";

const AnalysisDialogContext = createContext<DialogContext | undefined>(undefined);

export function AnalysisDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    return dismissed !== "true";
  });

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);
  const dismissDialog = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <AnalysisDialogContext.Provider value={{ isOpen, openDialog, closeDialog, dismissDialog }}>
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