'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { addCarAction } from './actions';

export default function AddCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const clientAction = async (formData: FormData) => {
    setLoading(true);
    const result = await addCarAction(formData);
    
    if (result?.error) {
      alert(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/cars'), 2000);
    }
  };

  if (success) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
          <CheckCircle2 size={64} className="text-[#00E676] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Car Added!</h2>
          <p className="text-gray-500 mt-2">Redirecting to fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex items-center gap-4">
        <Link href="/cars" className="text-gray-400 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Add New Car</h1>
      </header>

      <div className="p-8 max-w-3xl mx-auto">
        <form action={clientAction} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input name="brand" required placeholder="e.g. Hyundai" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input name="model" required placeholder="e.g. Creta" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input name="year" type="number" required placeholder="2023" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Per Day ($)</label>
              <input name="price" type="number" step="0.01" required placeholder="85.00" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
              <select name="transmission" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none bg-white">
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seats</label>
              <select name="seats" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none bg-white">
                <option>5</option>
                <option>7</option>
                <option>2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
              <select name="fuel_type" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00E676] outline-none bg-white">
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Car Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
              <input type="file" name="image" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
              <UploadCloud size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Click to upload an image</p>
              <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              disabled={loading}
              className="bg-[#00E676] hover:bg-[#00c968] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center min-w-[150px] transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Car to Fleet'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
