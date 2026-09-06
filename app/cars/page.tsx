import { createClient } from '@/lib/supabase/server';
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CarsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  const role = dbUser?.role || 'SUPER_ADMIN';

  // Fetch cars from Supabase
  let query = supabase.from('cars').select('*, users(shop_name)');
  
  if (role === 'SHOP_ADMIN') {
    query = query.eq('shop_id', user.id);
  }
  
  const { data: cars, error } = await query.order('created_at', { ascending: false });

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fleet Management</h1>
        <Link href="/cars/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30">
          <PlusCircle size={20} />
          Add New Car
        </Link>
      </header>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search cars by model or brand..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option>All Statuses</option>
                <option>Available</option>
                <option>Rented</option>
                <option>Maintenance</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Car Info</th>
                  <th className="px-6 py-4 font-medium">Shop / Owner</th>
                  <th className="px-6 py-4 font-medium">Price/Day</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cars && cars.length > 0 ? (
                  cars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 bg-gray-200 rounded object-cover flex items-center justify-center overflow-hidden">
                            {Array.isArray(car.images) && car.images.length > 0 && typeof car.images[0] === 'string' && car.images[0].startsWith('http') ? (
                              <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-400 text-xs text-center px-1">No Image</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{car.brand} {car.model}</div>
                            <div className="text-sm text-gray-500">{car.year} • {car.transmission} • {car.fuel_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-600">
                        {car.users?.shop_name || 'Admin'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        ${car.price_per_day}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          car.availability_status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                          car.availability_status === 'RENTED' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {car.availability_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            <Edit size={18} />
                          </button>
                          <form action={async () => {
                            'use server';
                            const sb = await createClient();
                            await sb.from('cars').delete().eq('id', car.id);
                            
                            // Revalidate path using dynamic import to avoid module issues if not at top level
                            const { revalidatePath } = await import('next/cache');
                            revalidatePath('/cars');
                          }}>
                            <button title="Delete" className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No cars uploaded yet. Click "Add New Car" to start your fleet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
