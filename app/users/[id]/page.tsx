import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Car, Calendar, DollarSign, MapPin } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UserDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const userId = params.id;

  // Fetch the target user details
  const { data: targetUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!targetUser) {
    return <div className="p-8 text-center">User not found</div>;
  }

  // Fetch cars hosted by this user
  const { data: hostedCars } = await supabase
    .from('cars')
    .select('*')
    .eq('shop_id', userId);

  // Fetch bookings made by this user (as a customer)
  const { data: userBookings } = await supabase
    .from('bookings')
    .select('*, cars(brand, model), shop:users!shop_id(shop_name)')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  // Fetch bookings for this user's shop (if they are a shop admin)
  const { data: shopBookings } = await supabase
    .from('bookings')
    .select('*, cars(brand, model), customer:users!customer_id(full_name)')
    .eq('shop_id', userId)
    .order('created_at', { ascending: false });

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex items-center gap-4">
        <Link href="/users" className="text-gray-400 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{targetUser.shop_name || targetUser.full_name || 'User Details'}</h1>
          <p className="text-gray-500 text-sm">{targetUser.email} • {targetUser.role}</p>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Hosted Cars Section */}
        {targetUser.role === 'SHOP_ADMIN' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Car className="text-indigo-600" />
              Cars Hosted ({hostedCars?.length || 0})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hostedCars && hostedCars.length > 0 ? (
                hostedCars.map(car => (
                  <div key={car.id} className="border border-gray-100 rounded-lg p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {car.images && car.images.length > 0 ? (
                        <img src={car.images[0]} alt={car.brand} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-8 h-8 text-gray-400 m-auto mt-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{car.brand} {car.model}</h3>
                      <p className="text-sm text-gray-500">${car.price_per_day}/day</p>
                      {car.city && (
                        <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {car.city}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No cars hosted yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Shop Bookings Section */}
        {targetUser.role === 'SHOP_ADMIN' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <DollarSign className="text-green-600" />
              Shop Bookings Received ({shopBookings?.length || 0})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Car</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shopBookings && shopBookings.length > 0 ? (
                    shopBookings.map(booking => (
                      <tr key={booking.id}>
                        <td className="px-4 py-3 font-medium">{booking.customer?.full_name || 'Unknown'}</td>
                        <td className="px-4 py-3">{booking.cars?.brand} {booking.cars?.model}</td>
                        <td className="px-4 py-3 font-bold text-green-600">${booking.total_price}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-full">{booking.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No bookings received.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Customer Bookings Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Bookings Made by User ({userBookings?.length || 0})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="px-4 py-3">Host Shop</th>
                  <th className="px-4 py-3">Car</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userBookings && userBookings.length > 0 ? (
                  userBookings.map(booking => (
                    <tr key={booking.id}>
                      <td className="px-4 py-3 font-medium">{booking.shop?.shop_name || 'System'}</td>
                      <td className="px-4 py-3">{booking.cars?.brand} {booking.cars?.model}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-full">{booking.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No bookings made.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </>
  );
}
