import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AccountsClient from './AccountsClient';
import type { ConnectedAccount } from '@/types/database';

export const metadata = {
  title: 'Connected Accounts — CreatorPost',
  description: 'Manage your connected social media accounts.',
};

export default async function AccountsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: accounts } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single();

  return (
    <AccountsClient
      connectedAccounts={(accounts ?? []) as ConnectedAccount[]}
      plan={profile?.plan ?? 'free'}
      userEmail={user.email ?? ''}
    />
  );
}
