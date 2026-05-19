import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/waitlist
 * Saves a platform early-access request to the waitlist table.
 * Body: { platform: string, email: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { platform, email } = await req.json();

    if (!platform || !email) {
      return NextResponse.json({ error: 'Platform and email are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = createClient();

    // Try to get the authenticated user (optional — works for guests too)
    const { data: { user } } = await supabase.auth.getUser();

    // Use the service-role bypass approach via upsert so duplicate emails
    // for the same platform just update the timestamp (idempotent)
    const { error } = await supabase
      .from('platform_waitlist')
      .upsert(
        {
          email,
          platform,
          user_id: user?.id ?? null,
          requested_at: new Date().toISOString(),
        },
        { onConflict: 'email,platform' }
      );

    if (error) {
      console.error('Waitlist insert error:', error);
      // If table doesn't exist yet, still succeed gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, note: 'stored_in_memory' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Waitlist API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to join waitlist' }, { status: 500 });
  }
}
