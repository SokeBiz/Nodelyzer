"use client";

import { useAnalysisDialog } from "@/context/AnalysisDialogContext";
import { useRouter, usePathname } from "next/navigation";
import React from "react";

export default function StartAnalysisDialog() {
  const { isOpen, closeDialog } = useAnalysisDialog();
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) return null;

  const handleCreate = () => {
    closeDialog();
    if (pathname !== "/analyze") {
      router.push("/analyze");
    }
  };

  const handleExisting = () => {
    // Placeholder – future: open saved analyses list
    closeDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={closeDialog} />
      <div className="relative bg-slate-800 rounded-xl p-8 w-[90%] max-w-lg border border-white/10 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Start Analysis</h2>
        <p className="text-slate-300 text-center">Would you like to create a new analysis or open an existing one?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCreate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
          >
            Create New
          </button>
          <button
            onClick={handleExisting}
            className="w-full border border-white/20 text-white py-2 rounded-lg font-medium hover:bg-white/10"
          >
            Open Existing
          </button>
        </div>
      </div>
    </div>
  );
} 