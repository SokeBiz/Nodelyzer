"use client";

import { useState, useEffect } from "react";
import { useAnalysisDialog } from "@/context/AnalysisDialogContext";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserAnalyses, AnalysisRecord } from "@/lib/analysisService";
import React from "react";

export default function StartAnalysisDialog() {
  const { isOpen, closeDialog } = useAnalysisDialog();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showList, setShowList] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);

  // Fetch analyses when list requested
  useEffect(() => {
    if (showList && user) {
      setLoadingList(true);
      getUserAnalyses(user.uid)
        .then(setAnalyses)
        .finally(() => setLoadingList(false));
    }
  }, [showList, user]);

  if (!isOpen) return null;

  const handleCreate = () => {
    closeDialog();
    if (pathname !== "/analyze") {
      router.push("/analyze");
    }
  };

  const handleExisting = () => {
    setShowList(true);
  };

  const handleSelectAnalysis = (id: string) => {
    closeDialog();
    router.push(`/analyze?id=${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={closeDialog} />
      <div className="relative bg-slate-800 rounded-xl p-8 w-[90%] max-w-lg border border-white/10 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
        {!showList && (
          <>
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
          </>
        )}

        {showList && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-4">Your Analyses</h2>
            {loadingList ? (
              <p className="text-center text-slate-300">Loading...</p>
            ) : analyses.length === 0 ? (
              <p className="text-center text-slate-400">No analyses found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {analyses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => a.id && handleSelectAnalysis(a.id)}
                    className="w-full border border-white/20 text-white py-2 rounded-lg font-medium hover:bg-white/10 text-left px-4"
                  >
                    <span className="block font-semibold">{a.name}</span>
                    <span className="block text-xs text-slate-400">{a.network.toUpperCase()} • {a.createdAt ? a.createdAt.toLocaleString() : ''}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowList(false)}
              className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium"
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
} 