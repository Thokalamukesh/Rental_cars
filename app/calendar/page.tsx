import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CalendarClient from './CalendarClient';

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  let bookingsQuery = supabase
    .from('bookings')
    .select('id, start_date, end_date, status, cars(id, brand, model), customer:users!bookings_customer_id_fkey(email)')
    .in('status', ['APPROVED', 'IN_PROGRESS'])
    .order('start_date', { ascending: true });

  if (role === 'SHOP_ADMIN') {
    bookingsQuery = bookingsQuery.eq('shop_id', user.id);
  }

  const { data: bookings } = await bookingsQuery;

  // Format data for calendar component
  const events = (bookings || []).map(b => {
    const car: any = b.cars;
    const customer: any = b.customer;
    return {
      id: b.id,
      title: `${car?.brand} ${car?.model} - ${customer?.email}`,
      start: new Date(b.start_date),
      end: new Date(b.end_date),
      status: b.status,
      carId: car?.id
    };
  });

  // Fetch cars for the manual block dropdown
  let carsQuery = supabase.from('cars').select('id, brand, model');
  if (role === 'SHOP_ADMIN') {
    carsQuery = carsQuery.eq('shop_id', user.id);
  }
  const { data: cars } = await carsQuery;

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Booking Calendar</h1>
      </header>
      <div className="p-8">
        <CalendarClient events={events} cars={cars || []} shopId={user.id} />
      </div>
    </>
  );
}
