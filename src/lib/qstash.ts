import { Client } from '@upstash/qstash';

/**
 * Singleton QStash client.
 * Used to publish delayed messages that trigger the publish webhook.
 */
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

/**
 * Schedules a post to be published at a given time.
 * QStash will call our /api/publish webhook at the scheduled time.
 *
 * @param postId  - UUID of the post row in Supabase
 * @param scheduledAt - ISO string of when to publish
 * @returns QStash message ID for tracking
 */
export async function schedulePost(postId: string, scheduledAt: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const publishUrl = `${appUrl}/api/publish`;

  const delaySeconds = Math.max(
    Math.floor((new Date(scheduledAt).getTime() - Date.now()) / 1000),
    1
  );

  const { messageId } = await qstash.publishJSON({
    url: publishUrl,
    delay: delaySeconds,
    body: { postId },
    headers: {
      'x-creatorpost-secret': process.env.QSTASH_NEXT_SIGNING_KEY || '',
    },
  });

  return messageId;
}

/**
 * Cancels a scheduled post message in QStash.
 */
export async function cancelScheduledPost(messageId: string): Promise<void> {
  await qstash.messages.delete(messageId);
}
