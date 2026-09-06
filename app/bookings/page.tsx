import { createClient } from '@/lib/supabase/server';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import RealtimeBookings from './RealtimeBookings';

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

  // Fetch bookings with car and customer details
  let query = supabase
    .from('bookings')
    .select(`
      *,
      cars(brand, model, price_per_day),
      customer:users!bookings_customer_id_fkey(email, shop_name, mobile_number)
    `);
    
  if (role === 'SHOP_ADMIN') {
    query = query.eq('shop_id', user.id);
  }
    
  const { data: bookings } = await query.order('created_at', { ascending: false });

  return (
    <>
      <RealtimeBookings />
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Booking Requests</h1>
      </header>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search bookings..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Car</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Dates</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings && bookings.length > 0 ? (
                  bookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {booking.cars?.brand} {booking.cars?.model}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="font-medium text-gray-900">
                          {booking.customer?.shop_name || 'No Name'}
                        </div>
                        <div className="text-sm">
                          {booking.customer?.mobile_number || booking.customer?.email.replace('@drivenow.app', '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(booking.start_date).toLocaleDateString()} <br/>
                        to {new Date(booking.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        ${booking.total_price}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {booking.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <form action={async () => {
                              'use server';
                              const sb = await createClient();
                              await sb.from('bookings').update({ status: 'APPROVED' }).eq('id', booking.id);
                            }}>
                              <button title="Approve" className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                                <CheckCircle size={18} />
                              </button>
                            </form>
                            <form action={async () => {
                              'use server';
                              const sb = await createClient();
                              await sb.from('bookings').update({ status: 'REJECTED' }).eq('id', booking.id);
                            }}>
                              <button title="Reject" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                <XCircle size={18} />
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
                      No bookings yet. When customers book cars in the app, they will appear here.
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
