import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ComposeClient from './ComposeClient';
import type { User } from '@/types/database';

export const metadata = {
  title: 'Compose Post — CreatorPost',
  description: 'AI-powered post composer. Generate captions and schedule across platforms.',
};

export default async function ComposePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('plan, posts_this_month, ai_gens_this_month')
    .eq('id', user.id)
    .single();

  return <ComposeClient user={profile as User | null} />;
}
