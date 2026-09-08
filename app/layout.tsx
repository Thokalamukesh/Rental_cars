import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AudioNotifier } from '@/components/AudioNotifier';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DriveNow Admin',
  description: 'Admin dashboard for DriveNow car rental platform',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no user, just render the content (like the Login page) without the sidebar
  if (!user) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <AudioNotifier />
          {children}
        </body>
      </html>
    );
  }

  // Fetch the user's role from the database
  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const role = dbUser?.role || 'SUPER_ADMIN'; // Fallback to super admin if not found

  return (
    <html lang="en">
      <body className={inter.className}>
        <AudioNotifier />
        <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-[#1E1E24] text-white flex flex-col shrink-0">
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
                D
              </div>
              <span className="text-xl font-bold">DriveNow Admin</span>
            </div>
            
            <nav className="flex-1 mt-6 px-4 space-y-2">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                Overview
              </Link>
              
              {role === 'SUPER_ADMIN' && (
                <>
                  <Link href="/users" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    Manage Users & Shops
                  </Link>
                  <Link href="/host-requests" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                    Host Requests
                  </Link>
                </>
              )}

              <Link href="/cars" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>
                Cars & Approvals
              </Link>
              <Link href="/bookings" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                Bookings
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                Settings
              </Link>
            </nav>
            <div className="p-4 border-t border-white/10">
              <form action={async () => {
                'use server';
                const s = await createClient();
                await s.auth.signOut();
              }}>
                <button className="w-full py-2 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                  Sign Out
                </button>
              </form>
            </div>
          </aside>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
