'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function createShopAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const shopName = formData.get('shop_name') as string;

  // We MUST use the Service Role Key to bypass RLS and create users
  // without logging out the current admin session!
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY is missing in Railway Variables.' };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Create the user using Admin API (does not sign them in)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto confirm so they can log in immediately
    });

    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error("Could not create user account");

    // 2. Add the user to our public.users table as a SHOP_ADMIN
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email: email,
      shop_name: shopName,
      role: 'SHOP_ADMIN'
    });

    if (dbError) throw dbError;

    revalidatePath('/users');
    return { success: true };

  } catch (err: any) {
    console.error("Admin Creation Error:", err);
    return { error: err.message || 'Failed to create shop admin.' };
  }
}
