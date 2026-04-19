import { NextRequest } from 'next/server'
import { err } from '@/lib/api'
import { isOxfordAudioUrl } from '@/lib/audio-url'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || ''

  if (!isOxfordAudioUrl(url)) {
    return err(400, 'invalid audio url')
  }

  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 60 * 60 * 24 * 30,
    },
  } as RequestInit & { cf?: { cacheEverything?: boolean; cacheTtl?: number } })

  if (!response.ok || !response.body) {
    return err(response.status || 502, 'audio fetch failed')
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'content-type': response.headers.get('content-type') || 'audio/mpeg',
      'cache-control': 'public, max-age=2592000, s-maxage=2592000, immutable',
      'access-control-allow-origin': '*',
    },
  })
}

