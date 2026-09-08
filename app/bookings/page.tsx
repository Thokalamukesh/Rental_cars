import { createClient } from '@/lib/supabase/server';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  const role = dbUser?.role || 'SUPER_ADMIN';

  // Fetch bookings from Supabase
  let query = supabase.from('bookings').select('*, cars(brand, model), customer:users!customer_id(full_name, mobile_number)');
  
  if (role === 'SHOP_ADMIN') {
    query = query.eq('shop_id', user.id);
  }
  
  const { data: bookings, error } = await query.order('created_at', { ascending: false });

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Bookings & Approvals</h1>
      </header>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search bookings by customer or car..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Customer Info</th>
                  <th className="px-6 py-4 font-medium">Car Details</th>
                  <th className="px-6 py-4 font-medium">Rental Period</th>
                  <th className="px-6 py-4 font-medium">Total Price</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings && bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{booking.customer?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{booking.customer?.mobile_number || 'No number'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{booking.cars?.brand} {booking.cars?.model}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div><span className="font-semibold text-gray-800">Pick:</span> {new Date(booking.start_date).toLocaleString()}</div>
                        <div><span className="font-semibold text-gray-800">Drop:</span> {new Date(booking.end_date).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        ${booking.total_price}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {booking.status === 'PENDING' && <Clock size={12} />}
                          {booking.status === 'APPROVED' && <CheckCircle size={12} />}
                          {booking.status === 'REJECTED' && <XCircle size={12} />}
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {booking.status === 'PENDING' && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <form action={async () => {
                              'use server';
                              const sb = await createClient();
                              await sb.from('bookings').update({ status: 'APPROVED' }).eq('id', booking.id);
                              
                              const { revalidatePath } = await import('next/cache');
                              revalidatePath('/bookings');
                            }}>
                              <button title="Approve" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 bg-white">
                                Approve
                              </button>
                            </form>
                            <form action={async () => {
                              'use server';
                              const sb = await createClient();
                              await sb.from('bookings').update({ status: 'REJECTED' }).eq('id', booking.id);
                              
                              const { revalidatePath } = await import('next/cache');
                              revalidatePath('/bookings');
                            }}>
                              <button title="Reject" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 bg-white">
                                Reject
                              </button>
                            </form>
                          </div>
                        )}
                        {booking.status === 'APPROVED' && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <form action={async () => {
                              'use server';
                              const sb = await createClient();
                              await sb.from('bookings').update({ status: 'COMPLETED' }).eq('id', booking.id);
                              
                              const { revalidatePath } = await import('next/cache');
                              revalidatePath('/bookings');
                            }}>
                              <button title="Mark Completed" className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white">
                                Mark Completed
                              </button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No bookings found.
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
