"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [user] = useAuthState(auth);
  const [signOut] = useSignOut(auth);

  const handleLogout = async () => {
    await signOut();
  };

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "";
  };



  const { user } = useAuth()
  console.log(user)


  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white"></div>
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Nodelyzer</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-slate-300 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="#security" className="text-slate-300 hover:text-white transition-colors">
            Security
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold cursor-pointer">
                {getUserInitial()}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer">
                Log In
              </Link>
              <Link href="#" className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white transition-colors cursor-pointer">
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <div className="relative">
            <button
              className="p-2 text-white hover:bg-slate-800 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Overlay for background click */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[99]"
                  style={{ background: "rgba(15,23,42,0.5)" }}
                  onClick={() => setIsMenuOpen(false)}
                ></div>
                <div
                  className={`fixed top-0 right-0 h-screen w-3/4 max-w-xs bg-slate-900 z-[100] shadow-xl transition-transform duration-300 ${
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                  } flex flex-col`}
                  style={{ transitionProperty: "transform" }}
                >
                  <div className="flex justify-end p-4">
                    <button
                      className="p-2 text-white hover:bg-slate-800 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <nav className="flex flex-col gap-6 p-8">
                    <Link
                      href="#features"
                      className="text-lg text-slate-300 hover:text-white transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Features
                    </Link>
                    <Link
                      href="#how-it-works"
                      className="text-lg text-slate-300 hover:text-white transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      How It Works
                    </Link>
                    <Link
                      href="#security"
                      className="text-lg text-slate-300 hover:text-white transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Security
                    </Link>
                  </nav>
                  <div className="mt-auto flex flex-col gap-4 p-8">
                    {user ? (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                            {getUserInitial()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-white transition-colors"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="w-full px-4 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-white transition-colors text-center"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Log In
                        </Link>
                        <Link
                          href="#"
                          className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white transition-colors text-center"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Get Started
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
