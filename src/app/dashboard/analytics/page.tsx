import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';
import type { Post } from '@/types/database';

export const metadata = {
  title: 'Analytics — CreatorPost',
  description: 'Track your post performance, platform reach, and publishing trends.',
};

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <AnalyticsClient posts={(posts ?? []) as Post[]} />;
}
