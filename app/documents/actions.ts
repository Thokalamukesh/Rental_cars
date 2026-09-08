'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateKycStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('kyc_documents').update({ status }).eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }

  // Log action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: 'UPDATE_KYC_STATUS',
    target_id: id,
    details: { new_status: status }
  });

  revalidatePath('/documents');
  return { success: true };
}
