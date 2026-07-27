import { DisasterType, AlertAction, getDisasterDetail, PlaceRecommendation } from "./alert-actions";
import { DEMO_PLACES, DemoPlace } from "./demo-places";

// 성동구 성수동 앵커 기본 좌표 (성수역 근처)
export const DEFAULT_ANCHOR_COORDS = {
  lat: 37.5445,
  lng: 127.0520,
};

/**
 * 두 위경도 좌표 간 Haversine 구면 거리를 계산합니다 (미터 단위).
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 도보 속도 80m/분 환산 및 올림 계산
 */
export function calculateWalkMinutes(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const distMeters = haversineDistance(lat1, lon1, lat2, lon2);
  const minutes = Math.ceil(distMeters / 80);
  return Math.max(1, minutes); // 최소 1분 이상
}

/**
 * note에 기재된 운영시간(운영 여부) 판별
 */
export function isCurrentlyOpen(note?: string, now = new Date()): boolean {
  if (!note) return true;

  const hour = now.getHours();
  const day = now.getDay(); // 0: 일요일, 6: 토요일

  if (note.includes("평일 09-18시만 운영")) {
    if (day === 0 || day === 6) return false;
    return hour >= 9 && hour < 18;
  }

  if (note.includes("평일 22시까지")) {
    if (day === 0 || day === 6) return false;
    return hour >= 9 && hour < 22;
  }

  return true;
}

export interface EvaluatedDemoPlace extends DemoPlace {
  walkMinutes: number;
  distanceMeters: number;
}

// 동일 세션 내 시나리오 전환 시 장소 중복 회피를 위한 히스토리 저장소
const recentRecommendedPlaces: string[] = [];

/**
 * DEMO_PLACES 데이터셋에서 조건(suitableFor, 운영시간, Haversine 거리)을 만족하는 후보 추출
 */
export function getFilteredDemoPlaces(
  disasterType: DisasterType,
  userCoords = DEFAULT_ANCHOR_COORDS,
  now = new Date()
): EvaluatedDemoPlace[] {
  const candidates: EvaluatedDemoPlace[] = [];

  for (const place of DEMO_PLACES) {
    // 1. suitableFor 에 해당 재난이 없으면 100% 필터 제외
    if (!place.suitableFor.includes(disasterType)) {
      continue;
    }

    // 2. flood(큰비) 시 개활지/공원/서울숲 절대 제외
    if (disasterType === "flood") {
      if (place.note?.includes("flood 절대 제외") || place.target.includes("공원") || place.target.includes("잔디밭")) {
        continue;
      }
    }

    // 3. note 운영시간 판별 (영업중이 아니면 제외)
    if (!isCurrentlyOpen(place.note, now)) {
      continue;
    }

    // 4. Haversine 거리 및 도보 분수 계산
    const distMeters = haversineDistance(userCoords.lat, userCoords.lng, place.lat, place.lng);
    const walkMins = calculateWalkMinutes(userCoords.lat, userCoords.lng, place.lat, place.lng);

    candidates.push({
      ...place,
      walkMinutes: walkMins,
      distanceMeters: distMeters,
    });
  }

  // 거리가 가까운 순으로 정렬
  candidates.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return candidates;
}

/**
 * 3줄 행동 가이드에 적합한 장소를 안전하게 매칭/결합하여 반환하는 핵심 함수
 */
export function getPersonalizedActions(
  type: DisasterType,
  enableGps: boolean = true,
  userCoords = DEFAULT_ANCHOR_COORDS,
  now = new Date()
): [AlertAction, AlertAction, AlertAction] {
  const detail = getDisasterDetail(type);
  const actions: [AlertAction, AlertAction, AlertAction] = JSON.parse(JSON.stringify(detail.actions));

  // enableGps가 false이거나 GPS 차단 시 장소 뱃지 없이 원본 일반 문구로 안전 폴백
  if (!enableGps) {
    return actions;
  }

  const candidates = getFilteredDemoPlaces(type, userCoords, now);

  if (candidates.length > 0) {
    // 중복 회피: 2개 이상 후보가 있을 경우 최근에 안 쓰인 장소를 우선 선택
    let selected = candidates[0];
    if (candidates.length > 1) {
      const unused = candidates.find((c) => !recentRecommendedPlaces.includes(c.name));
      if (unused) {
        selected = unused;
      }
    }

    // 최근 추천 히스토리에 기록 (최대 4개 보관)
    recentRecommendedPlaces.unshift(selected.name);
    if (recentRecommendedPlaces.length > 4) {
      recentRecommendedPlaces.pop();
    }

    // [확인필요] 콘솔 경고 남기기
    if (selected.visualCue.includes("[확인필요]")) {
      console.warn(`[visualCue 로드뷰 확인 필요 경고] POI '${selected.name}'의 visualCue가 임시값입니다: "${selected.visualCue}"`);
    }

    const placeRec: PlaceRecommendation = {
      visualCue: selected.visualCue,
      name: selected.name,
      targetLabel: selected.target,
      walkMinutes: selected.walkMinutes,
      category: selected.target,
      crossesRoad: false,
    };

    // 재난 유형에 맞춰 1~2번째 핵심 대피/도움요청 카드에 장소 뱃지 연결
    if (type === "earthquake" || type === "fire") {
      // 지진/화재: 3번(밖으로 이동/개활지) 카드에 장소 매칭
      actions[2].place = placeRec;
    } else if (type === "flood") {
      // 큰비: 2번(높은 층으로 올라가요) 카드에 장소 매칭
      actions[1].place = placeRec;
    } else if (type === "missing") {
      // 실종: 2번(주변 어른에게 말해요) 카드에 장소 매칭
      actions[1].place = placeRec;
    }
  }

  return actions;
}
