import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInsert() {
  const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);
  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }
  const user = users[0];

  const { data, error } = await supabase.from('cars').insert({
    shop_id: user.id,
    brand: 'Test',
    model: 'Test Model',
    year: 2025,
    transmission: 'Automatic',
    seats: 5,
    fuel_type: 'Petrol',
    city: 'New York',
    location_name: 'tirupathi',
    price_per_day: 2990,
    latitude: 17.385,
    longitude: 78.4867,
    images: [],
    availability_status: 'AVAILABLE'
  });

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}

testInsert();
