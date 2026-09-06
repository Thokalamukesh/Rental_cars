'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Store, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const shopName = formData.get('shop_name') as string;
    
    const supabase = createClient();

    try {
      // 1. Create the user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Could not create user account");

      // 2. Add the user to our public.users table as a SHOP_ADMIN
      const { error: dbError } = await supabase.from('users').insert({
        id: userId,
        email: email,
        shop_name: shopName,
        role: 'SHOP_ADMIN'
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => router.push('/users'), 2000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create shop admin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
          <CheckCircle2 size={64} className="text-[#00E676] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Shop Admin Created!</h2>
          <p className="text-gray-500 mt-2">Redirecting to users list...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex items-center gap-4">
        <Link href="/users" className="text-gray-400 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Create Shop Login</h1>
      </header>

      <div className="p-8 max-w-2xl mx-auto">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
          
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Store size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Shop Details</h2>
              <p className="text-sm text-gray-500">Create a login for a new fleet owner.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
              <input name="shop_name" required placeholder="e.g. City Rentals" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Login Email</label>
              <input name="email" type="email" required placeholder="shop@example.com" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temporary Password</label>
              <input name="password" type="password" required placeholder="Minimum 6 characters" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none" />
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
            <button 
              disabled={loading}
              className="bg-[#00E676] hover:bg-[#00c968] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center min-w-[180px] transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
