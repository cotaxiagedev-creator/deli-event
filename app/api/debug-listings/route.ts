import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ ok: true, isSupabaseConfigured, source: 'not-configured', count: 0 });
    }
    const { data, error } = await supabase
      .from('listings')
      .select('id')
      .limit(100);
    if (error) {
      return NextResponse.json({ ok: false, isSupabaseConfigured, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, isSupabaseConfigured, source: 'supabase', count: data?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error';
    return NextResponse.json({ ok: false, isSupabaseConfigured, error: msg }, { status: 500 });
  }
}
