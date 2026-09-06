'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RealtimeBookings() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for the "Ding" sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const supabase = createClient();

    // Subscribe to new insertions on the 'bookings' table
    const channel = supabase
      .channel('realtime_bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('New booking received!', payload);
          
          // Play the sound
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error("Browser blocked autoplay. User must interact with the page first.", err);
            });
          }

          // Refresh the page data
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null; // This component doesn't render anything visible
}
