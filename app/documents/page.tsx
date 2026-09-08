import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DocumentsClient from './DocumentsClient';

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  if (role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-red-500">Access Denied. Only Super Admins can review platform documents.</div>;
  }

  // Fetch KYC Docs (assuming kyc_documents table exists from phase 3)
  const { data: kycDocs } = await supabase
    .from('kyc_documents')
    .select('*, user:users!kyc_documents_user_id_fkey(email, full_name)')
    .order('created_at', { ascending: false });

  // Fetch Cars to check insurance expiry
  const { data: cars } = await supabase
    .from('cars')
    .select('id, brand, model, insurance_document_url, insurance_expiry_date, owner:users!cars_shop_id_fkey(email, shop_name)')
    .not('insurance_expiry_date', 'is', null)
    .order('insurance_expiry_date', { ascending: true });

  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">Verification Documents</h1>
      </header>
      <div className="p-8">
        <DocumentsClient kycDocs={kycDocs || []} cars={cars || []} />
      </div>
    </>
  );
}
