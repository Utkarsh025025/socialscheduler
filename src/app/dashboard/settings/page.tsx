import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import SettingsClient from './SettingsClient';
import type { User } from '@/types/database';

export const metadata = {
  title: 'Settings — CreatorPost',
  description: 'Manage your profile, billing plan, and account security.',
};

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    // Suspense required because SettingsClient uses useSearchParams()
    <Suspense fallback={
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-12 bg-zinc-800 rounded-xl w-64" />
        <div className="h-48 bg-zinc-800 rounded-2xl" />
      </div>
    }>
      <SettingsClient user={profile as User | null} />
    </Suspense>
  );
}
