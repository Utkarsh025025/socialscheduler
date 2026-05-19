import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendPostPublishedEmail, sendPostFailedEmail } from '@/lib/email';

/**
 * POST /api/publish
 * 
 * This is the QStash webhook endpoint. QStash calls this URL at the scheduled
 * time with the postId in the body. We then "publish" the post and send an
 * email notification.
 * 
 * In production you'd call the actual social media APIs here (Instagram Graph
 * API, LinkedIn API, etc.). For now we mark it as published in Supabase and
 * send a confirmation email.
 */
export async function POST(req: NextRequest) {
  // ── 1. Verify the request is from QStash ──────────────────
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  const rawBody = await req.text();

  try {
    await receiver.verify({
      signature: req.headers.get('upstash-signature') ?? '',
      body: rawBody,
    });
  } catch (err) {
    console.error('QStash signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── 2. Parse body ──────────────────────────────────────────
  const { postId } = JSON.parse(rawBody) as { postId: string };

  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
  }

  // ── 3. Use Service Role client (no user session in webhook) ─
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // ── 4. Fetch the post ──────────────────────────────────────
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select(`
      *,
      users:user_id (
        id, email, full_name
      )
    `)
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    console.error('Post not found for publishing:', postId);
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Skip if already published (idempotency guard)
  if (post.status === 'published') {
    return NextResponse.json({ message: 'Already published' });
  }

  // ── 5. Simulate publishing to social platforms ─────────────
  // TODO: Replace with real social media API calls per platform:
  // - Instagram: Instagram Graph API (POST /me/media + /me/media/publish)
  // - LinkedIn:  LinkedIn Share API  (POST /ugcPosts)
  // - TikTok:    TikTok Content Posting API
  // - YouTube:   YouTube Data API v3 (videos.insert)
  // - Facebook:  Facebook Graph API  (POST /{page-id}/feed)
  // - Pinterest: Pinterest API v5    (POST /pins)

  let publishError: string | null = null;

  try {
    // For now, simulate a successful publish
    // In production, loop through post.platforms and call each API
    await Promise.all(
      (post.platforms as string[]).map(async (platform: string) => {
        console.log(`Publishing post ${postId} to ${platform}...`);
        // e.g. await publishToInstagram(post, connectedAccount);
      })
    );
  } catch (err: any) {
    publishError = err.message || 'Unknown publish error';
    console.error('Publish error:', publishError);
  }

  // ── 6. Update post status in Supabase ─────────────────────
  const newStatus = publishError ? 'failed' : 'published';

  await supabase
    .from('posts')
    .update({
      status: newStatus,
      published_at: publishError ? null : new Date().toISOString(),
      error_message: publishError,
      qstash_message_id: null,
    })
    .eq('id', postId);

  // ── 7. Send email notification ─────────────────────────────
  const user = post.users as { email: string; full_name: string };
  if (user?.email) {
    try {
      if (publishError) {
        await sendPostFailedEmail({
          to: user.email,
          userName: user.full_name || 'Creator',
          platforms: post.platforms as string[],
          errorMessage: publishError,
        });
      } else {
        await sendPostPublishedEmail({
          to: user.email,
          userName: user.full_name || 'Creator',
          platforms: post.platforms as string[],
          postContent: post.content,
        });
      }
    } catch (emailErr) {
      // Non-critical — log but don't fail the webhook
      console.error('Email send error:', emailErr);
    }
  }

  return NextResponse.json({
    success: !publishError,
    status: newStatus,
    postId,
  });
}
