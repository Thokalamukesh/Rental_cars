import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuditLogsClient from './AuditLogsClient';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = dbUser?.role || 'SUPER_ADMIN';

  if (role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-red-500">Access Denied. Only Super Admins can view audit logs.</div>;
  }

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, user:users!audit_logs_user_id_fkey(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <>
      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">System Audit Logs</h1>
      </header>
      <div className="p-8">
        <AuditLogsClient logs={logs || []} />
      </div>
    </>
  );
}
