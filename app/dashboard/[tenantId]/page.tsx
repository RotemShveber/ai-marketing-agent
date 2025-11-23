import { redirect } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/server'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default async function DashboardPage({
  params,
}: {
  params: { tenantId: string }
}) {
  const supabase = await createClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify tenant access
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, role, tenants(*)')
    .eq('tenant_id', params.tenantId)
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    redirect('/')
  }

  return <DashboardContent tenantId={params.tenantId} />
}

