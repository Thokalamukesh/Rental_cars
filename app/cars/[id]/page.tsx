import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import CarDetailsClient from './CarDetailsClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CarDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  // Fetch Car
  let carQuery = supabase.from('cars').select('*, owner:users!cars_shop_id_fkey(full_name, email, shop_name)').eq('id', params.id).single();
  
  if (role === 'SHOP_ADMIN') {
    carQuery = (carQuery as any).eq('shop_id', user.id);
  }

  const { data: car, error } = await carQuery;

  if (error || !car) {
    notFound();
  }

  // Fetch Bookings for this car
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, customer:users!bookings_customer_id_fkey(email, full_name)')
    .eq('car_id', car.id)
    .order('created_at', { ascending: false });

  // Calculate stats
  let totalRevenue = 0;
  bookings?.forEach(b => {
    if (b.status === 'COMPLETED' || b.status === 'APPROVED') {
      totalRevenue += Number(b.total_price);
    }
  });

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex items-center gap-4">
        <Link href="/cars" className="text-gray-400 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{car.brand} {car.model} Details</h1>
      </header>

      <div className="p-8">
        <CarDetailsClient car={car} bookings={bookings || []} totalRevenue={totalRevenue} />
      </div>
    </>
  );
}
