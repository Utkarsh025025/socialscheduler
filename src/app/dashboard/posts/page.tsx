import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PostsClient from './PostsClient';
import type { Post } from '@/types/database';

export const metadata = {
  title: 'My Posts — CreatorPost',
  description: 'View, filter, and manage all your scheduled and published posts.',
};

export default async function PostsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <PostsClient initialPosts={(posts ?? []) as Post[]} />;
}
