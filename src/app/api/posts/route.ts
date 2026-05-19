import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const content = formData.get('content') as string;
    const platforms = JSON.parse(formData.get('platforms') as string) as string[];
    const status = formData.get('status') as string || 'draft';
    const scheduledAt = formData.get('scheduled_at') as string | null;
    const imageFile = formData.get('image') as File | null;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // ── Plan limit check ────────────────────────────────────────
    const { data: profile } = await supabase
      .from('users')
      .select('plan, posts_this_month')
      .eq('id', user.id)
      .single();

    if (profile) {
      const limits = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
      if (limits.posts_per_month !== -1 && profile.posts_this_month >= limits.posts_per_month) {
        return NextResponse.json(
          { error: `You've reached your ${limits.posts_per_month} post/month limit on the ${profile.plan} plan. Upgrade to post more.` },
          { status: 403 }
        );
      }
    }
    // ────────────────────────────────────────────────────────────

    let imageUrl: string | null = null;

    // Upload image to Supabase Storage if provided
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, buffer, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        // Continue without image rather than failing the whole request
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    // Insert post into database
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        platforms,
        status,
        image_url: imageUrl,
        scheduled_at: scheduledAt || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Post insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment posts_this_month counter (non-critical)
    try {
      await supabase.rpc('increment_posts_count', { user_id: user.id });
    } catch {
      console.log('Could not increment posts count');
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    console.error('Posts API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
