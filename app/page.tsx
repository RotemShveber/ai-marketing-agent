import { redirect } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's tenants
  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(*)')
    .eq('user_id', user.id)
    .limit(1)

  if (tenantUsers && tenantUsers.length > 0) {
    redirect(`/dashboard/${tenantUsers[0].tenant_id}`)
  }

  redirect('/onboarding')
}

