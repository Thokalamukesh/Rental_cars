'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCarStatus(carId: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('cars').update({ availability_status: status }).eq('id', carId);
  
  if (error) {
    return { success: false, error: error.message };
  }

  // Log action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: 'UPDATE_CAR_STATUS',
    target_id: carId,
    details: { new_status: status }
  });

  revalidatePath(`/cars/${carId}`);
  revalidatePath('/cars');
  
  return { success: true };
}
