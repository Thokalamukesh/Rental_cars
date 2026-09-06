import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle, Clock } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch the user's role
  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const role = dbUser?.role || 'SUPER_ADMIN';

  // 1. Fetch Cars
  let carsQuery = supabase.from('cars').select('id', { count: 'exact', head: true });
  if (role === 'SHOP_ADMIN') {
    carsQuery = carsQuery.eq('shop_id', user.id);
  }
  const { count: carsCount } = await carsQuery;

  // 2. Fetch Users (Only relevant for Super Admin)
  let usersCount = 0;
  if (role === 'SUPER_ADMIN') {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
    usersCount = count || 0;
  }

  // 3. Fetch Bookings (Pending & Active)
  let bookingsQuery = supabase.from('bookings').select('id, status', { count: 'exact' });
  let recentBookingsQuery = supabase
    .from('bookings')
    .select('*, cars(brand, model), customer:users!bookings_customer_id_fkey(email)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (role === 'SHOP_ADMIN') {
    bookingsQuery = bookingsQuery.eq('shop_id', user.id);
    recentBookingsQuery = recentBookingsQuery.eq('shop_id', user.id);
  }

  const { data: allBookings } = await bookingsQuery;
  const pendingCount = allBookings?.filter(b => b.status === 'PENDING').length || 0;
  const activeCount = allBookings?.filter(b => b.status === 'APPROVED' || b.status === 'IN_PROGRESS').length || 0;

  const { data: recentBookings } = await recentBookingsQuery;

  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {role === 'SUPER_ADMIN' && (
            <MetricCard title="Total Users" value={usersCount.toString()} trend="Live" isPositive={true} />
          )}
          <MetricCard title="Active Cars" value={(carsCount || 0).toString()} trend="Live" isPositive={true} />
          <MetricCard title="Pending Approvals" value={pendingCount.toString()} trend="Needs Action" isPositive={pendingCount === 0} />
          <MetricCard title="Active Bookings" value={activeCount.toString()} trend="In Progress" isPositive={true} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Recent Bookings</h2>
            <Link href="/bookings" className="text-sm text-indigo-600 font-medium hover:underline">View All</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Car</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings && recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-800 font-medium">{booking.customer?.email}</td>
                      <td className="px-6 py-4 text-gray-600">{booking.cars?.brand} {booking.cars?.model}</td>
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
                      <td className="px-6 py-4 text-right font-bold text-gray-800">${booking.total_price}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No recent bookings found.
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

function MetricCard({ title, value, trend, isPositive }: { title: string, value: string, trend: string, isPositive: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
      <div className="text-gray-500 font-medium text-sm">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <div className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
          {isPositive ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
          )}
          {trend}
        </div>
      </div>
    </div>
  );
}
