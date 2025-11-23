import { NextRequest, NextResponse } from 'next/server'
import { createClientSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClientSupabase()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

