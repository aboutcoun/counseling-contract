import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ loggedIn: false, isAdmin: false, hasProvider: false })
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const isAdmin = adminEmails.includes(user.email.toLowerCase())

  const service = createServiceRoleClient()
  const { data: accounts } = await service
    .from('provider_accounts')
    .select('provider_id')
    .eq('email', user.email)

  const providerIds = (accounts ?? []).map((a: { provider_id: string }) => a.provider_id)

  let unreadMessages = 0
  let hasApprovedProvider = false
  if (providerIds.length > 0) {
    const { count: approvedCount } = await service
      .from('providers')
      .select('id', { count: 'exact', head: true })
      .in('id', providerIds)
      .eq('status', 'approved')
    hasApprovedProvider = (approvedCount ?? 0) > 0

    const { count } = await service
      .from('provider_messages')
      .select('id', { count: 'exact', head: true })
      .in('provider_id', providerIds)
      .is('read_at', null)
    unreadMessages = count ?? 0
  }

  return NextResponse.json({
    loggedIn: true,
    email: user.email,
    isAdmin,
    hasProvider: providerIds.length > 0,
    canUseCommunity: isAdmin || hasApprovedProvider,
    unreadMessages,
  })
}
