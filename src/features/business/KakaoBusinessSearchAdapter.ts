import type { BusinessSearchAdapter, BusinessCandidate } from "./BusinessSearchAdapter";

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? "";

type KakaoDocument = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  distance: string;
  place_url: string;
};

type KakaoResponse = {
  documents: KakaoDocument[];
  meta: { total_count: number; is_end: boolean };
};

function maskPhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/(\d{2,3})-(\d{3,4})-(\d{4})/, "$1-***-$4");
}

function formatDistance(meters: string): string {
  const m = parseInt(meters, 10);
  if (isNaN(m)) return "";
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

export function createKakaoBusinessSearchAdapter(): BusinessSearchAdapter {
  return {
    async search(query, position) {
      if (!KAKAO_KEY) throw new Error("KAKAO_KEY_EMPTY — env 변수가 APK에 포함되지 않았어요");

      const params = new URLSearchParams({ query, size: "15" });
      // 쿼리에 지역명이 포함된 경우 GPS를 보내지 않음.
      // GPS + radius를 같이 보내면 카카오가 현재 위치 5km 안으로만 제한하여
      // "오목교역 치킨집" 같은 원거리 지역 검색이 0건이 된다.
      // 쿼리에 지역명이 포함된 경우 GPS를 보내지 않음.
      // GPS + radius를 같이 보내면 카카오가 현재 위치 5km 안으로만 제한하여
      // "오목교역 치킨집" 같은 원거리 지역 검색이 0건이 된다.
      const hasExplicitLocation = /역|동|구|시|읍|면|거리|마을|단지|터미널|공항|공원|광장/.test(query);
      if (position && !hasExplicitLocation) {
        params.set("x", String(position.lng));
        params.set("y", String(position.lat));
        params.set("sort", "distance");
        // radius 미설정 → 거리 제한 없이 가까운 순 정렬
      }

      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`,
        { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Kakao ${res.status}: ${errBody.slice(0, 300)}`);
      }

      const data = (await res.json()) as KakaoResponse;
      return data.documents.map((doc): BusinessCandidate => ({
        id: doc.id,
        name: doc.place_name,
        category: doc.category_name.split(" > ").pop() ?? doc.category_name,
        address: doc.road_address_name || doc.address_name,
        phone: doc.phone,
        maskedPhone: maskPhone(doc.phone),
        distance: position ? formatDistance(doc.distance) : undefined,
        placeUrl: doc.place_url || undefined,
      }));
    },
  };
}
