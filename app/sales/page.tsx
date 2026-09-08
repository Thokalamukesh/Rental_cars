import { createClient } from '@/lib/supabase/server';
import SalesClient from './SalesClient';
import { redirect } from 'next/navigation';

export default async function SalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  // Fetch all completed or approved bookings (which generate revenue)
  let query = supabase
    .from('bookings')
    .select('id, created_at, start_date, end_date, total_price, status, refund_amount, extra_charges, cars(brand, model), customer:users!bookings_customer_id_fkey(email), shop:users!bookings_shop_id_fkey(shop_name)')
    .in('status', ['APPROVED', 'COMPLETED', 'IN_PROGRESS', 'CANCELLED'])
    .order('created_at', { ascending: false });

  if (role === 'SHOP_ADMIN') {
    query = query.eq('shop_id', user.id);
  }

  const { data: bookings } = await query;

  // Process data for sales
  const platformCommissionRate = 0.10; // 10% commission

  const salesData = (bookings || []).map(b => {
    const gross = Number(b.total_price) || 0;
    const extra = Number(b.extra_charges) || 0;
    const totalGross = gross + extra;
    
    // If cancelled, calculate based on cancellation policy (assume full refund for now unless custom logic is added)
    const refund = Number(b.refund_amount) || 0;
    
    const commission = (totalGross - refund) * platformCommissionRate;
    const payout = (totalGross - refund) - commission;
    
    const car: any = b.cars;
    const customer: any = b.customer;
    const shop: any = b.shop;
    return {
      id: b.id,
      date: new Date(b.created_at).toLocaleDateString(),
      car: `${car?.brand} ${car?.model}`,
      customer: customer?.email || 'Unknown',
      shop: shop?.shop_name || 'System',
      status: b.status,
      gross: totalGross,
      refund: refund,
      commission: commission,
      payout: payout,
      netRevenue: commission // From platform perspective
    };
  });

  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Sales & Money Management</h1>
      </header>
      <div className="p-8">
        <SalesClient initialData={salesData} role={role} />
      </div>
    </>
  );
}
