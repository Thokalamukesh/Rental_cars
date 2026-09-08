import { createClient } from '@/lib/supabase/server';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SubmitButton } from '@/components/SubmitButton';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function HostRequestsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  const role = dbUser?.role || 'SUPER_ADMIN';

  if (role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Super Admins only.</div>;
  }

  // Fetch host requests
  const { data: requests } = await supabase
    .from('host_requests')
    .select('*, users(full_name, mobile_number, email)')
    .order('created_at', { ascending: false });

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Host Requests</h1>
      </header>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search requests..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">User Info</th>
                  <th className="px-6 py-4 font-medium">Email / Phone</th>
                  <th className="px-6 py-4 font-medium">Requested On</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests && requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{req.users?.full_name || 'Unknown User'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-800 font-medium">{req.users?.email}</div>
                        <div className="text-sm text-gray-500">{req.users?.mobile_number || 'No Phone'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {req.status === 'PENDING' && <Clock size={12} />}
                          {req.status === 'APPROVED' && <CheckCircle size={12} />}
                          {req.status === 'REJECTED' && <XCircle size={12} />}
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <form action={async () => {
                              'use server';
                              const sb = await createClient();
                              // Update request status
                              await sb.from('host_requests').update({ status: 'APPROVED' }).eq('id', req.id);
                              
                              // Upgrade user to shop admin and set a default shop name
                              await sb.from('users').update({ 
                                role: 'SHOP_ADMIN',
                                shop_name: `${req.users?.full_name || 'User'}'s Garage`
                              }).eq('id', req.user_id);
                              
                              revalidatePath('/host-requests');
                              revalidatePath('/users');
                            }}>
                              <SubmitButton title="Approve" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 bg-white">
                                Approve
                              </SubmitButton>
                            </form>
                            <form action={async () => {
                              'use server';
                              const sb = await createClient();
                              await sb.from('host_requests').update({ status: 'REJECTED' }).eq('id', req.id);
                              revalidatePath('/host-requests');
                            }}>
                              <SubmitButton title="Reject" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 bg-white">
                                Reject
                              </SubmitButton>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No host requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
