'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveCarRequest(request: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  // 1. Geocode location_name
  let lat = 17.3850;
  let lng = 78.4867;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(request.location_name)}&format=json&limit=1`, { 
      headers: { 'User-Agent': 'DriveNowApp/1.0' } 
    });
    const data = await res.json();
    if (data && data.length > 0) {
      lat = parseFloat(data[0].lat);
      lng = parseFloat(data[0].lon);
    }
  } catch (e) {
    console.error("Geocoding failed", e);
  }

  // 2. Insert into cars table
  const { data: carData, error: carError } = await supabase.from('cars').insert({
    shop_id: request.owner_id, // The owner is the shop admin for their own car
    brand: request.brand,
    model: request.model,
    year: request.year,
    transmission: request.transmission,
    seats: request.seats,
    fuel_type: request.fuel_type,
    city: 'All Cities',
    location_name: request.location_name,
    price_per_day: request.price_per_day,
    latitude: lat,
    longitude: lng,
    images: request.images || [],
    rc_document_url: request.rc_document_url,
    insurance_document_url: request.insurance_document_url,
    availability_status: 'AVAILABLE'
  }).select().single();

  if (carError) {
    return { success: false, error: carError.message };
  }

  // 3. Update request status
  await supabase.from('car_requests').update({ status: 'APPROVED' }).eq('id', request.id);

  // 4. Log action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: 'APPROVE_CAR_REQUEST',
    target_id: request.id,
    details: { car_id: carData.id, owner_id: request.owner_id }
  });

  revalidatePath('/owner-requests');
  revalidatePath('/cars');
  return { success: true };
}

export async function rejectCarRequest(requestId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('car_requests')
    .update({ status: 'REJECTED', rejection_reason: reason })
    .eq('id', requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log action
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: 'REJECT_CAR_REQUEST',
    target_id: requestId,
    details: { reason }
  });

  revalidatePath('/owner-requests');
  return { success: true };
}
