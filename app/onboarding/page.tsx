import { redirect } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/server'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user already has a tenant
  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)

  if (tenantUsers && tenantUsers.length > 0) {
    redirect(`/dashboard/${tenantUsers[0].tenant_id}`)
  }

  return <OnboardingForm userId={user.id} />
}

