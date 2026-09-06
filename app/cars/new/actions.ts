'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCarAction(formData: FormData) {
  const supabase = await createClient();

  // Get the current logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to add a car.' };
  }

  try {
    const file = formData.get('image') as File;
    let imageUrl = '';

    // Upload Image
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        return { error: 'Failed to upload image. Please check Supabase Storage permissions.' };
      }

      const { data: { publicUrl } } = supabase.storage.from('cars').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    // Insert into database
    const { error: insertError } = await supabase.from('cars').insert({
      shop_id: user.id,
      brand: formData.get('brand'),
      model: formData.get('model'),
      year: parseInt(formData.get('year') as string),
      transmission: formData.get('transmission'),
      seats: parseInt(formData.get('seats') as string),
      fuel_type: formData.get('fuel_type'),
      city: formData.get('city') || 'All Cities',
      price_per_day: parseFloat(formData.get('price') as string),
      images: imageUrl ? [imageUrl] : [],
      availability_status: 'AVAILABLE'
    });

    if (insertError) {
      console.error("DB Insert Error:", insertError);
      return { error: 'Failed to save car details to database.' };
    }

    revalidatePath('/cars');
    return { success: true };
    
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
