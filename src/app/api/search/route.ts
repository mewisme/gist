import { NextRequest, NextResponse } from 'next/server'

import { getUserFromCookies } from '@/lib/auth'
import type { GistDetails } from '@/lib/db/schema'
import { GistRepository } from '@/lib/repositories/gist-repository'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!query) {
    return NextResponse.json<GistDetails[]>([])
  }

  const user = await getUserFromCookies(request.cookies)

  const gistRepository = new GistRepository()

  try {
    const results = await gistRepository.searchGists(query, limit, offset, user?.id)
    return NextResponse.json<GistDetails[]>(results ?? [])
  } catch (error) {
    console.error('search gists failed', error)
    return NextResponse.json<GistDetails[]>([])
  }
}
