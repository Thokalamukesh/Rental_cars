import { createClient } from '@/lib/supabase/server';
import { PlusCircle, Search, ShieldAlert, Store, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { SubmitButton } from '@/components/SubmitButton';
import { revalidatePath } from 'next/cache';

export default async function UsersPage({ searchParams }: { searchParams: { q?: string, role?: string, error?: string } }) {
  const supabase = await createClient();
  
  // Build query
  let query = supabase.from('users').select('*').order('created_at', { ascending: false });
  
  if (searchParams.q) {
    query = query.or(`email.ilike.%${searchParams.q}%,shop_name.ilike.%${searchParams.q}%,full_name.ilike.%${searchParams.q}%`);
  }
  
  if (searchParams.role && searchParams.role !== 'All Roles') {
    let dbRole = searchParams.role;
    if (dbRole === 'Super Admin') dbRole = 'SUPER_ADMIN';
    if (dbRole === 'Shop Admin') dbRole = 'SHOP_ADMIN';
    if (dbRole === 'Customer') dbRole = 'USER';
    query = query.eq('role', dbRole);
  }

  const { data: users } = await query;

  return (
    <>
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Shops & Users</h1>
        <Link href="/users/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30">
          <PlusCircle size={20} />
          Create Shop Login
        </Link>
      </header>

      {searchParams.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-8 mt-6">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {searchParams.error}</span>
        </div>
      )}

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <form className="relative max-w-md w-full flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={searchParams.q}
                  placeholder="Search shops by name or email..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
              <select 
                name="role" 
                defaultValue={searchParams.role || 'All Roles'}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option>All Roles</option>
                <option>Super Admin</option>
                <option>Shop Admin</option>
                <option>Customer</option>
              </select>
              <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">Filter</button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Shop / User</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Joined Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                        {user.role === 'SUPER_ADMIN' ? (
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <ShieldAlert size={18} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Store size={18} />
                          </div>
                        )}
                        <div>
                          <div>{user.shop_name || user.full_name || 'System Admin'}</div>
                          {user.mobile_number && <div className="text-xs text-gray-500 font-normal">{user.mobile_number}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'SHOP_ADMIN' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.role === 'SHOP_ADMIN' && (
                            <Link href={`/cars?shop_id=${user.id}`} title="View Shop Cars">
                              <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200 bg-white">
                                <Eye size={18} />
                              </button>
                            </Link>
                          )}
                          <Link href={`/users/${user.id}`} className="text-sm text-indigo-600 font-medium hover:underline flex items-center px-2">
                            Details
                          </Link>
                          <form action={async () => {
                            'use server';
                            const sb = await createClient();
                            const { error } = await sb.from('users').delete().eq('id', user.id);
                            
                            if (error) {
                              const { redirect } = await import('next/navigation');
                              redirect(`/users?error=Cannot delete user. They have active cars or bookings linked to them.`);
                            }
                            revalidatePath('/users');
                          }}>
                            <SubmitButton title="Delete User" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 bg-white">
                              <Trash2 size={18} />
                            </SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No users found. Are you sure you ran the Supabase SQL script and logged in?
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
