'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cancelBooking(id: string, reason: string, refundAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('bookings')
    .update({ 
      status: 'CANCELLED',
      cancellation_reason: reason,
      refund_amount: refundAmount
    })
    .eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }

  // Log action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: 'CANCEL_BOOKING',
    target_id: id,
    details: { reason, refundAmount }
  });

  revalidatePath(`/bookings/${id}`);
  revalidatePath('/bookings');
  return { success: true };
}

export async function completeBooking(id: string, damageReport: string, extraCharges: number, securityDeposit: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('bookings')
    .update({ 
      status: 'COMPLETED',
      damage_report: damageReport,
      extra_charges: extraCharges,
      security_deposit_status: securityDeposit
    })
    .eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }

  // Log action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: 'COMPLETE_BOOKING',
    target_id: id,
    details: { damageReport, extraCharges, securityDeposit }
  });

  revalidatePath(`/bookings/${id}`);
  revalidatePath('/bookings');
  return { success: true };
}
