import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BookingDetailsClient from './BookingDetailsClient';

export default async function BookingDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  // Fetch Booking
  let query = supabase
    .from('bookings')
    .select('*, cars(id, brand, model, images), customer:users!bookings_customer_id_fkey(full_name, email, mobile_number)')
    .eq('id', params.id)
    .single();

  if (role === 'SHOP_ADMIN') {
    query = (query as any).eq('shop_id', user.id);
  }

  const { data: booking, error } = await query;

  if (error || !booking) {
    notFound();
  }

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex items-center gap-4">
        <Link href="/bookings" className="text-gray-400 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Booking Management</h1>
      </header>

      <div className="p-8">
        <BookingDetailsClient booking={booking} />
      </div>
    </>
  );
}
