import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CalendarClient from './CalendarClient';
import type { Post } from '@/types/database';

export const metadata = {
  title: 'Content Calendar — CreatorPost',
  description: 'View and manage your scheduled social media posts on a month-view calendar.',
};

export default async function CalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch ALL posts for this user so the client can filter by month
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  return <CalendarClient allPosts={(posts ?? []) as Post[]} />;
}
