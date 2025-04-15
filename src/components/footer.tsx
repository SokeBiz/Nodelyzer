"use client";

import Link from "next/link";
// import { Button } from "./ui/button";
import {
  Github,
  Twitter,
  Linkedin,
  ChevronRight
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      {/* Newsletter Section */}
      <div className="container mx-auto py-16 px-4">
        <div className="bg-slate-900 rounded-2xl p-8 md:p-12 mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Stay Updated on Blockchain Security
            </h3>
            <p className="text-slate-300 mb-8">
              Join our newsletter to receive the latest updates on blockchain security risks, vulnerabilities, and best practices.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Subscribe <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo and social links */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Nodelyzer</span>
            </Link>
            <p className="text-slate-400 mb-6">
              Comprehensive security analysis for blockchain node networks.
            </p>
            <div className="flex gap-4">
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <Github className="h-5 w-5 text-slate-300" />
                </div>
              </Link>
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <Twitter className="h-5 w-5 text-slate-300" />
                </div>
              </Link>
              <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <Linkedin className="h-5 w-5 text-slate-300" />
                </div>
              </Link>
            </div>
          </div>

          {/* Links columns */}
          <div className="col-span-1">
            <h4 className="text-white font-semibold text-lg mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-slate-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#security" className="text-slate-400 hover:text-white transition-colors">Security</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Roadmap</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">API Reference</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Community</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Support</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-slate-800 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            © {currentYear} Nodelyzer. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex gap-6">
            <Link href="#" className="text-slate-500 hover:text-slate-300 text-sm">
              Privacy Policy
            </Link>
            <Link href="#" className="text-slate-500 hover:text-slate-300 text-sm">
              Terms of Service
            </Link>
            <Link href="#" className="text-slate-500 hover:text-slate-300 text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
