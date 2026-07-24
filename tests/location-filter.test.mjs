import test from "node:test";
import assert from "node:assert/strict";
import {
  haversineDistance,
  calculateWalkMinutes,
  isCurrentlyOpen,
  getFilteredDemoPlaces,
  getPersonalizedActions,
  DEFAULT_ANCHOR_COORDS,
} from "../lib/curated-places.ts";
import { DEMO_PLACES } from "../lib/demo-places.ts";

test("Haversine 구면 거리 계산 및 도보 80m/분 환산 검증", () => {
  // 성수역 근처 앵커 좌표와 성수동 구두테마공원(lat: 37.5447764, lng: 127.0524092) 간 거리
  const dist = haversineDistance(
    DEFAULT_ANCHOR_COORDS.lat,
    DEFAULT_ANCHOR_COORDS.lng,
    37.5447764,
    127.0524092
  );
  assert.ok(dist > 0 && dist < 500, `거리계산 결과 이상: ${dist}m`);

  const walkMins = calculateWalkMinutes(
    DEFAULT_ANCHOR_COORDS.lat,
    DEFAULT_ANCHOR_COORDS.lng,
    37.5447764,
    127.0524092
  );
  assert.ok(walkMins >= 1 && walkMins <= 5, `도보 분수 결과 이상: ${walkMins}분`);
});

test("운영시간(note) 판별 검증 (야간 23시 기준)", () => {
  const nightTime = new Date(2026, 6, 24, 23, 0, 0); // 밤 11시

  assert.equal(isCurrentlyOpen("24시", nightTime), true);
  assert.equal(isCurrentlyOpen("평일 09-18시만 운영", nightTime), false);
  assert.equal(isCurrentlyOpen("평일 22시까지", nightTime), false);
});

test("침수(큰비) 시나리오에서는 서울숲, 잔디밭, 공통 개활지가 100% 필터 거부된다", () => {
  const daytime = new Date(2026, 6, 24, 14, 0, 0); // 평일 낮 2시
  const floodCandidates = getFilteredDemoPlaces("flood", DEFAULT_ANCHOR_COORDS, daytime);

  for (const place of floodCandidates) {
    assert.equal(place.suitableFor.includes("flood"), true);
    assert.equal(place.name.includes("서울숲"), false, `서울숲이 침수 장소에 포함됨: ${place.name}`);
    assert.equal(place.target.includes("잔디밭"), false, `잔디밭이 침수 장소에 포함됨: ${place.name}`);
  }

  const floodAction = getPersonalizedActions("flood", true, DEFAULT_ANCHOR_COORDS, daytime);
  assert.ok(floodAction[1].place);
  assert.notEqual(floodAction[1].place.name, "서울숲 가족마당");
});

test("4개 시나리오(지진, 큰비, 불, 실종) 전환 시 서로 다른 POI를 추천하여 다양성을 확보한다", () => {
  const daytime = new Date(2026, 6, 24, 14, 0, 0);

  const eq = getPersonalizedActions("earthquake", true, DEFAULT_ANCHOR_COORDS, daytime);
  const fl = getPersonalizedActions("flood", true, DEFAULT_ANCHOR_COORDS, daytime);
  const fi = getPersonalizedActions("fire", true, DEFAULT_ANCHOR_COORDS, daytime);
  const mi = getPersonalizedActions("missing", true, DEFAULT_ANCHOR_COORDS, daytime);

  const eqPlace = eq[2].place?.name;
  const flPlace = fl[1].place?.name;
  const fiPlace = fi[2].place?.name;
  const miPlace = mi[1].place?.name;

  assert.ok(eqPlace);
  assert.ok(flPlace);
  assert.ok(fiPlace);
  assert.ok(miPlace);

  // 최소 3개 이상의 서로 다른 POI가 추천되어야 함
  const uniqueNames = new Set([eqPlace, flPlace, fiPlace, miPlace]);
  assert.ok(uniqueNames.size >= 3, `중복 회피 실패 (unique POI count: ${uniqueNames.size})`);
});
