import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/types/database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { topic, platform, tone, includeHashtags, includeEmoji, imageBase64 } = body;

    if (!topic && !imageBase64) {
      return NextResponse.json({ error: 'Topic or image is required' }, { status: 400 });
    }

    // ── AI generation limit check ───────────────────────────────
    const { data: profile } = await supabase
      .from('users')
      .select('plan, ai_gens_this_month')
      .eq('id', user.id)
      .single();

    if (profile) {
      const limits = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
      if (limits.ai_gens_per_month !== -1 && profile.ai_gens_this_month >= limits.ai_gens_per_month) {
        return NextResponse.json(
          { error: `You've used all ${limits.ai_gens_per_month} AI generations this month on the ${profile.plan} plan. Upgrade for unlimited generations.` },
          { status: 403 }
        );
      }
    }
    // ────────────────────────────────────────────────────────────

    const platformGuides: Record<string, string> = {
      instagram: 'Instagram (casual, visual, story-driven, up to 2200 chars, heavy hashtag use)',
      tiktok:    'TikTok (trendy, punchy, Gen-Z friendly, very short, hook-first)',
      linkedin:  'LinkedIn (professional, thought-leadership, insight-driven, no slang)',
      youtube:   'YouTube (descriptive, keyword-rich, call-to-action focused)',
      facebook:  'Facebook (conversational, community-focused, moderate length)',
      pinterest: 'Pinterest (inspirational, descriptive, SEO-friendly keywords)',
    };

    const toneGuides: Record<string, string> = {
      professional:  'authoritative, polished, and professional',
      casual:        'friendly, relaxed, and conversational',
      funny:         'witty, humorous, and entertaining',
      inspirational: 'motivating, uplifting, and empowering',
      educational:   'informative, clear, and value-packed',
    };

    const platformGuide = platformGuides[platform] ?? platformGuides['instagram'];
    const toneGuide     = toneGuides[tone]         ?? toneGuides['casual'];

    const prompt = `You are an expert social media copywriter specializing in ${platformGuide}.

Write a highly engaging post caption with a ${toneGuide} tone.

Topic: ${topic || 'Based on the provided image'}
Platform: ${platform}
${includeHashtags ? 'Include 5-10 relevant hashtags at the end.' : 'Do NOT include hashtags.'}
${includeEmoji    ? 'Use relevant emojis throughout the caption naturally.' : 'Do NOT use emojis.'}

Rules:
- Start with a strong hook that stops the scroll
- Keep the caption appropriate for ${platform}
- Make it feel authentic, not AI-generated
- End with a clear call-to-action

Return ONLY the caption text, nothing else. No explanations, no formatting labels.`;

    // gemini-2.5-flash — confirmed working with this API key
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    if (imageBase64) {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data:     imageBase64.split(',')[1],
            mimeType: imageBase64.split(';')[0].split(':')[1],
          },
        },
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const caption = result.response.text().trim();

    // Increment AI generation count
    const { data: profileForIncrement } = await supabase
      .from('users')
      .select('ai_gens_this_month')
      .eq('id', user.id)
      .single();

    if (profileForIncrement) {
      await supabase
        .from('users')
        .update({ ai_gens_this_month: (profileForIncrement.ai_gens_this_month ?? 0) + 1 })
        .eq('id', user.id);
    }

    return NextResponse.json({ caption });

  } catch (error: any) {
    console.error('Caption generation error:', error);

    // Only catch actual HTTP 429 rate-limit responses
    const isRateLimit =
      error?.status === 429 ||
      String(error?.message).includes('Too Many Requests');

    if (isRateLimit) {
      return NextResponse.json(
        { error: 'AI rate limit hit. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    // Return the real error message so it is visible in the UI
    const msg = error?.message || error?.toString() || 'Failed to generate caption';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
