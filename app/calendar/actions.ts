'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function blockDates(carId: string, startDate: string, endDate: string, shopId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  // To block dates, we insert a booking with status 'IN_PROGRESS' or a custom status like 'MAINTENANCE_BLOCK'
  // Let's use 'APPROVED' but with shop as customer and 0 price to act as a block.
  
  const { error } = await supabase.from('bookings').insert({
    car_id: carId,
    customer_id: user.id, // Self-booking
    shop_id: shopId,
    start_date: new Date(startDate).toISOString(),
    end_date: new Date(endDate).toISOString(),
    total_price: 0,
    status: 'APPROVED', // This blocks the calendar in the app since it checks for APPROVED overlapping dates
    cancellation_reason: 'Maintenance Block' // Just a marker
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Log action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: 'BLOCK_CAR_DATES',
    target_id: carId,
    details: { start_date: startDate, end_date: endDate }
  });

  revalidatePath('/calendar');
  return { success: true };
}
