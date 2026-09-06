import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Car, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const userId = params.id;
  
  // 1. Fetch User Details
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) {
    return <div className="p-8 text-center">User not found</div>;
  }

  // 2. Fetch Cars owned by this user (if Shop Admin)
  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('shop_id', userId);

  // 3. Fetch Bookings made by this user (if Customer)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, cars(brand, model)')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex items-center gap-4">
        <Link href="/users" className="text-gray-400 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {user.shop_name ? user.shop_name : user.email}'s Profile
        </h1>
        <span className={`px-3 py-1 ml-4 rounded-full text-xs font-bold ${
          user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
          user.role === 'SHOP_ADMIN' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {user.role}
        </span>
      </header>

      <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Info Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-4">Account Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>
            {user.shop_name && (
              <div>
                <p className="text-sm text-gray-500">Shop Name</p>
                <p className="font-medium text-gray-800">{user.shop_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Joined</p>
              <p className="font-medium text-gray-800">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Cars List (For Shop Admins) */}
          {(user.role === 'SHOP_ADMIN' || user.role === 'SUPER_ADMIN') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                <Car className="text-indigo-600" size={20} />
                <h2 className="text-lg font-bold text-gray-800">Fleet ({cars?.length || 0})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {cars && cars.length > 0 ? (
                  cars.map((car) => (
                    <div key={car.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-800">{car.brand} {car.model} ({car.year})</p>
                        <p className="text-sm text-gray-500">${car.price_per_day} / day</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        {car.availability_status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">No cars listed by this shop.</div>
                )}
              </div>
            </div>
          )}

          {/* Bookings List (For Customers) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Booking History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-800">
                        {booking.cars?.brand} {booking.cars?.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">${booking.total_price}</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {booking.status === 'APPROVED' && <CheckCircle2 size={14} className="text-green-500" />}
                        {booking.status === 'PENDING' && <Clock size={14} className="text-yellow-500" />}
                        {booking.status === 'REJECTED' && <XCircle size={14} className="text-red-500" />}
                        <span className="text-xs font-medium text-gray-600">{booking.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">No bookings made by this user yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
