import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { schedulePost, cancelScheduledPost } from '@/lib/qstash';

/**
 * POST /api/schedule
 * Schedules an existing draft post for publishing via QStash.
 * Body: { postId: string, scheduledAt: string (ISO) }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, scheduledAt } = await req.json();

    if (!postId || !scheduledAt) {
      return NextResponse.json({ error: 'postId and scheduledAt are required' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Schedule time must be in the future' }, { status: 400 });
    }

    // Fetch the post and verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Cancel previous QStash message if rescheduling
    if (post.qstash_message_id) {
      try {
        await cancelScheduledPost(post.qstash_message_id);
      } catch {
        // Not critical — message may have already been delivered
      }
    }

    // Queue the post in QStash
    const messageId = await schedulePost(postId, scheduledAt);

    // Update post in Supabase
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledDate.toISOString(),
        qstash_message_id: messageId,
      })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId,
      scheduledAt: scheduledDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Schedule API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to schedule post' }, { status: 500 });
  }
}

/**
 * DELETE /api/schedule
 * Cancels a scheduled post (removes from QStash, reverts to draft).
 * Body: { postId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    const { data: post, error } = await supabase
      .from('posts')
      .select('qstash_message_id, status')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.qstash_message_id) {
      try {
        await cancelScheduledPost(post.qstash_message_id);
      } catch {
        // OK — may already be delivered
      }
    }

    await supabase
      .from('posts')
      .update({ status: 'draft', scheduled_at: null, qstash_message_id: null })
      .eq('id', postId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to cancel' }, { status: 500 });
  }
}
