// ============================================================
// CreatorPost — Database TypeScript Types
// These types mirror the Supabase database tables exactly.
// Use these throughout the app to get autocomplete and catch errors.
// ============================================================

export type Plan = 'free' | 'pro' | 'agency';
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'pinterest';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

// ------------------------------------------------------------
// TABLE: users
// ------------------------------------------------------------
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  posts_this_month: number;
  ai_gens_this_month: number;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// TABLE: connected_accounts
// ------------------------------------------------------------
export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  account_name: string | null;
  account_avatar: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// TABLE: posts
// ------------------------------------------------------------
export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  platforms: Platform[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  qstash_message_id: string | null;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// TABLE: post_analytics
// ------------------------------------------------------------
export interface PostAnalytics {
  id: string;
  post_id: string;
  platform: Platform;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  fetched_at: string;
}

// ------------------------------------------------------------
// TABLE: waitlist
// ------------------------------------------------------------
export interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
}

// ------------------------------------------------------------
// Supabase Database shape (for createClient<Database>())
// ------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at' | 'posts_this_month' | 'ai_gens_this_month'> & {
          posts_this_month?: number;
          ai_gens_this_month?: number;
        };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      connected_accounts: {
        Row: ConnectedAccount;
        Insert: Omit<ConnectedAccount, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ConnectedAccount, 'id' | 'user_id' | 'created_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Post, 'id' | 'user_id' | 'created_at'>>;
      };
      post_analytics: {
        Row: PostAnalytics;
        Insert: Omit<PostAnalytics, 'id' | 'fetched_at'>;
        Update: Partial<Omit<PostAnalytics, 'id' | 'post_id'>>;
      };
      waitlist: {
        Row: WaitlistEntry;
        Insert: Pick<WaitlistEntry, 'email'>;
        Update: never;
      };
    };
  };
};

// ------------------------------------------------------------
// Plan limits (used throughout the app for upgrade prompts)
// ------------------------------------------------------------
export const PLAN_LIMITS: Record<Plan, {
  posts_per_month: number;   // -1 = unlimited
  accounts: number;
  ai_gens_per_month: number; // -1 = unlimited
  team_members: boolean;
  white_label: boolean;
}> = {
  free: {
    posts_per_month: 10,
    accounts: 2,
    ai_gens_per_month: 20,
    team_members: false,
    white_label: false,
  },
  pro: {
    posts_per_month: -1,
    accounts: 5,
    ai_gens_per_month: -1,
    team_members: false,
    white_label: false,
  },
  agency: {
    posts_per_month: -1,
    accounts: 10,
    ai_gens_per_month: -1,
    team_members: true,
    white_label: true,
  },
};

// ------------------------------------------------------------
// Platform display metadata (colors, labels, icons)
// ------------------------------------------------------------
export const PLATFORM_META: Record<Platform, {
  label: string;
  color: string;
  bgColor: string;
  maxChars: number;
}> = {
  instagram: { label: 'Instagram', color: '#E1306C', bgColor: '#fdf2f8', maxChars: 2200 },
  tiktok:    { label: 'TikTok',    color: '#000000', bgColor: '#f0f0f0', maxChars: 2200 },
  youtube:   { label: 'YouTube',   color: '#FF0000', bgColor: '#fff0f0', maxChars: 5000 },
  linkedin:  { label: 'LinkedIn',  color: '#0077B5', bgColor: '#eff8ff', maxChars: 3000 },
  facebook:  { label: 'Facebook',  color: '#1877F2', bgColor: '#eff5ff', maxChars: 63206 },
  pinterest: { label: 'Pinterest', color: '#E60023', bgColor: '#fff0f0', maxChars: 500  },
};
