'use client';

import { useState } from 'react';
import Link from 'next/link';
import {useSignInWithEmailAndPassword} from 'react-firebase-hooks/auth'
import {auth} from '@/lib/firebase'
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    
    try {
      const result = await signInWithEmailAndPassword(trimmedEmail, trimmedPassword);
      if (result) {
        console.log('User signed in successfully:', result.user);
        setEmail("");
        setPassword("");
        router.push('/');
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      // You can show a more user-friendly error message here
      alert('Error during sign in. Please check your credentials and try again.');
    }
  }; 

  const handleGoogleLogin = () => {
    // Handle Google login logic here
    console.log('Google login clicked');
  };

  return (
    <section className="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-md flex justify-center py-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white"></div>
          </div>
          <span className="font-bold text-2xl text-white tracking-tight">Nodelyzer</span>
        </Link>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Sign in with <span className="flex">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </span>
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-400">
              New here?{' '}
              <Link href="/signup" className="text-blue-500 hover:text-blue-400 transition-colors font-bold underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}


