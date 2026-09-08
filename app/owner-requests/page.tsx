import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OwnerRequestsClient from './OwnerRequestsClient';

export default async function OwnerRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  if (role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-red-500">Access Denied. Only Super Admins can review owner requests.</div>;
  }

  const { data: requests, error } = await supabase
    .from('car_requests')
    .select('*, owner:users!owner_id(email, full_name, shop_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching car requests:", error);
  }

  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Owner Car Requests</h1>
      </header>
      <div className="p-8">
        <OwnerRequestsClient initialRequests={requests || []} />
      </div>
    </>
  );
}
