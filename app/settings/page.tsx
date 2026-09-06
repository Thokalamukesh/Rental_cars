import { createClient } from '@/lib/supabase/server';
import { Settings, Save } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  async function updateProfile(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('users').update({
      shop_name: formData.get('shop_name'),
      mobile_number: formData.get('mobile_number'),
      city: formData.get('city'),
    }).eq('id', user.id);

    revalidatePath('/settings');
  }

  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Shop Settings</h1>
      </header>

      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <Settings className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Profile Details</h2>
          </div>
          
          <form action={updateProfile} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
              <input 
                name="shop_name" 
                defaultValue={profile?.shop_name || ''}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number (For Customer Contact)</label>
              <input 
                name="mobile_number" 
                defaultValue={profile?.mobile_number || ''}
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary City</label>
              <select 
                name="city" 
                defaultValue={profile?.city || 'All Cities'}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
              >
                <option>New York</option>
                <option>Los Angeles</option>
                <option>Chicago</option>
                <option>Houston</option>
                <option>Miami</option>
                <option>All Cities</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
