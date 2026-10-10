// Supabase(PostgREST)는 기본적으로 한 요청당 최대 1000건까지만 반환합니다.
// 이 함수는 range()로 페이지를 나눠 끝까지 가져옵니다.
//
// 사용 예:
//   const providers = await fetchAllRows((from, to) =>
//     supabase.from('providers').select('*').not('latitude', 'is', null).range(from, to)
//   )
export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => any
): Promise<T[]> {
  const pageSize = 1000
  let from = 0
  let all: T[] = []

  while (true) {
    const { data, error } = await queryPage(from, from + pageSize - 1)
    if (error) {
      console.error('데이터 조회 실패:', error.message)
      break
    }
    if (!data || data.length === 0) break
    all = all.concat(data as T[])
    if (data.length < pageSize) break
    from += pageSize
  }

  return all
}
