import { SettingsContent } from '@/components/dashboard/SettingsContent'

export default function SettingsPage({ params }: { params: { tenantId: string } }) {
  return <SettingsContent tenantId={params.tenantId} />
}
