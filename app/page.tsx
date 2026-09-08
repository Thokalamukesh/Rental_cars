import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle, Clock } from 'lucide-react';
import RevenueChart from '@/components/RevenueChart';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  // 1. Fetch Cars
  let carsQuery = supabase.from('cars').select('id, availability_status', { count: 'exact' });
  if (role === 'SHOP_ADMIN') {
    carsQuery = carsQuery.eq('shop_id', user.id);
  }
  const { data: allCars } = await carsQuery;
  const totalCars = allCars?.length || 0;
  const availableCars = allCars?.filter(c => c.availability_status === 'AVAILABLE').length || 0;
  const bookedCars = allCars?.filter(c => c.availability_status === 'BOOKED').length || 0;

  // 2. Fetch Users
  let usersCount = 0;
  if (role === 'SUPER_ADMIN') {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
    usersCount = count || 0;
  }

  // 3. Fetch Bookings
  let bookingsQuery = supabase.from('bookings').select('*, cars(brand, model), customer:users!bookings_customer_id_fkey(email)').order('created_at', { ascending: false });
  
  if (role === 'SHOP_ADMIN') {
    bookingsQuery = bookingsQuery.eq('shop_id', user.id);
  }

  const { data: allBookings } = await bookingsQuery;
  
  const pendingCount = allBookings?.filter(b => b.status === 'PENDING').length || 0;
  const activeCount = allBookings?.filter(b => b.status === 'APPROVED' || b.status === 'IN_PROGRESS').length || 0;
  const completedCount = allBookings?.filter(b => b.status === 'COMPLETED').length || 0;

  // 4. Calculate Revenue
  let totalRevenue = 0;
  let monthlyRevenue = 0;
  let todayRevenue = 0;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const chartDataMap: Record<string, number> = {};

  allBookings?.forEach(b => {
    if (b.status === 'COMPLETED' || b.status === 'APPROVED') {
      const amt = Number(b.total_price) || 0;
      totalRevenue += amt;
      
      const bDate = new Date(b.created_at);
      if (bDate >= startOfMonth) monthlyRevenue += amt;
      if (bDate >= startOfDay) todayRevenue += amt;
      
      // Chart grouping (by month for simplicity)
      const monthName = bDate.toLocaleString('default', { month: 'short' });
      chartDataMap[monthName] = (chartDataMap[monthName] || 0) + amt;
    }
  });

  const chartData = Object.keys(chartDataMap).map(k => ({ name: k, revenue: chartDataMap[k] }));
  const recentBookings = allBookings?.slice(0, 5) || [];

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {role === 'SHOP_ADMIN' ? 'Shop Admin Dashboard' : 'Super Admin Overview'}
        </h1>
      </header>

      <div className="p-8">
        {/* Revenue Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard title="Today's Revenue" value={`₹${todayRevenue.toFixed(2)}`} trend="Daily" isPositive={true} />
          <MetricCard title="Monthly Revenue" value={`₹${monthlyRevenue.toFixed(2)}`} trend="This Month" isPositive={true} />
          <MetricCard title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} trend="All Time" isPositive={true} />
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <MiniMetric title="Active Bookings" value={activeCount.toString()} color="text-blue-600" />
          <MiniMetric title="Pending" value={pendingCount.toString()} color="text-orange-600" />
          <MiniMetric title="Completed" value={completedCount.toString()} color="text-green-600" />
          <MiniMetric title="Total Cars" value={totalCars.toString()} color="text-gray-800" />
          <MiniMetric title="Available Cars" value={availableCars.toString()} color="text-green-600" />
          <MiniMetric title="Booked Cars" value={bookedCars.toString()} color="text-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Revenue Chart</h2>
            {chartData.length > 0 ? (
              <RevenueChart data={chartData} />
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-400">No revenue data available</div>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Recent Bookings</h2>
              <Link href="/bookings" className="text-sm text-indigo-600 font-medium hover:underline">View All</Link>
            </div>
            <div className="p-0">
              {recentBookings.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {recentBookings.map((booking) => (
                    <li key={booking.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{booking.cars?.brand} {booking.cars?.model}</p>
                        <p className="text-sm text-gray-500">{booking.customer?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">₹{booking.total_price}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{booking.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">No recent bookings</div>
              )}
            </div>
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
          {trend}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
      <div className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
