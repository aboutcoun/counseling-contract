// 좌표(latitude/longitude)가 없는 providers를 찾아 네이버 지오코딩으로 채우는 1회성 스크립트.
// 실행: node scripts/geocode-backfill.mjs
//
// .env.local 파일에서 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// NEXT_PUBLIC_NAVER_MAP_CLIENT_ID, NAVER_MAP_CLIENT_SECRET 을 읽어옵니다.

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
  const env = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return env
}

const env = loadEnvLocal()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const NAVER_ID = env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
const NAVER_SECRET = env.NAVER_MAP_CLIENT_SECRET

if (!SUPABASE_URL || !SERVICE_KEY || !NAVER_ID || !NAVER_SECRET) {
  console.error('.env.local에서 필요한 값을 찾지 못했습니다. 4개 키가 모두 있는지 확인해주세요.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function geocodeRaw(query) {
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      'x-ncp-apigw-api-key-id': NAVER_ID,
      'x-ncp-apigw-api-key': NAVER_SECRET,
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  const first = data?.addresses?.[0]
  if (!first) return null
  return { latitude: parseFloat(first.y), longitude: parseFloat(first.x) }
}

// "우편번호 : 12345" 같은 비표준 접미사를 제거하고, 그래도 실패하면
// 괄호 안 동/건물명 상세정보까지 뺀 주소로 한 번 더 시도합니다.
async function geocode(address) {
  const withoutZip = address.replace(/\s*우편번호\s*[:：]\s*\d+\s*$/, '').trim()

  let result = await geocodeRaw(withoutZip)
  if (result) return result

  const withoutDetail = withoutZip.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (withoutDetail !== withoutZip) {
    result = await geocodeRaw(withoutDetail)
    if (result) return result
  }

  return null
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Supabase는 기본적으로 한 번에 최대 1000건까지만 반환하므로, 페이지 단위로 끝까지 가져옵니다.
async function fetchAllTargets() {
  const pageSize = 1000
  let from = 0
  let all = []
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, address')
      .is('latitude', null)
      .not('address', 'is', null)
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('조회 실패:', error.message)
      process.exit(1)
    }
    all = all.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

async function main() {
  const targets = await fetchAllTargets()

  console.log(`좌표 없는 센터 ${targets.length}개 처리 시작`)

  let success = 0
  let failed = 0

  for (const [i, p] of targets.entries()) {
    const geo = await geocode(p.address)
    if (geo) {
      const { error: updateError } = await supabase
        .from('providers')
        .update({ latitude: geo.latitude, longitude: geo.longitude })
        .eq('id', p.id)
      if (updateError) {
        console.error(`  [실패-저장] ${p.name}: ${updateError.message}`)
        failed++
      } else {
        success++
      }
    } else {
      console.warn(`  [실패-변환] ${p.name}: "${p.address}" 좌표를 찾지 못함`)
      failed++
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  진행: ${i + 1}/${targets.length}`)
    }

    // 초당 요청 속도 제한 방지용 짧은 대기
    await sleep(120)
  }

  console.log(`완료. 성공 ${success}건, 실패 ${failed}건`)
}

main()
