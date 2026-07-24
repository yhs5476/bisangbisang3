import { DisasterType } from "./alert-actions";

export interface DemoPlace {
  name: string;
  target: string;
  visualCue: string;
  lat: number;
  lng: number;
  suitableFor: DisasterType[];
  note?: string;
}

// walkMinutes는 앵커 좌표 기준 haversine 계산 (도보 80m/분) 후 주입
export const DEMO_PLACES: DemoPlace[] = [
  // ───────── 개활지 (지진 / 불) ─────────
  {
    name: "경동초등학교",
    target: "운동장",
    visualCue: "🏫 빨간 벽돌 학교", // 성수일로4길 34
    lat: 37.5429557,
    lng: 127.0504631,
    suitableFor: ["earthquake", "fire"],
  },
  {
    name: "서울경일초등학교",
    target: "운동장",
    visualCue: "🏫 큰 초등학교", // 뚝섬로 332
    lat: 37.5404004,
    lng: 127.0470746,
    suitableFor: ["earthquake", "fire"],
  },
  {
    name: "서울성수초등학교",
    target: "운동장",
    visualCue: "🏫 성수 초등학교", // 아차산로17길 21
    lat: 37.5441969,
    lng: 127.0633077,
    suitableFor: ["earthquake", "fire"],
  },
  {
    name: "성수동 구두테마공원",
    target: "공원 중앙",
    visualCue: "👟 큰 구두 조형물 공원", // ✅ 대형 하이힐 조형물 실재
    lat: 37.5447764,
    lng: 127.0524092,
    suitableFor: ["earthquake", "fire"],
  },
  {
    name: "성삼공원",
    target: "공원",
    visualCue: "🌳 작은 동네 공원", // 성수동2가
    lat: 37.5420115,
    lng: 127.0601844,
    suitableFor: ["earthquake", "fire"],
  },
  {
    name: "서울숲 가족마당",
    target: "잔디밭",
    visualCue: "🌳 넓은 잔디밭 공원",
    lat: 37.5453904,
    lng: 127.0387852,
    suitableFor: ["earthquake", "fire"],
    note: "한강변 저지대 — flood 절대 제외",
  },

  // ───────── 높은 층 (큰비) ─────────
  {
    name: "성수도서관",
    target: "3층",
    visualCue: "📚 성수 도서관", // 뚝섬로1길 43, 평일 22시까지
    lat: 37.5453916,
    lng: 127.0469605,
    suitableFor: ["flood", "missing"],
    note: "평일 22시까지",
  },
  {
    name: "성수1가2동 주민센터",
    target: "3층",
    visualCue: "🏛️ 신축 주민센터", // 왕십리로5길 3, 리뷰상 신축
    lat: 37.5463162,
    lng: 127.0442692,
    suitableFor: ["flood", "missing"],
    note: "평일 09-18시만 운영",
  },
  {
    name: "성수2가3동 주민센터",
    target: "3층",
    visualCue: "🏛️ 동 주민센터", // 광나루로2길 35
    lat: 37.5482051,
    lng: 127.0552403,
    suitableFor: ["flood", "missing"],
    note: "평일 09-18시만 운영",
  },
  {
    name: "경일중학교",
    target: "4층",
    visualCue: "🏫 경일중 학교 건물", // 성수일로 27
    lat: 37.5435667,
    lng: 127.0483522,
    suitableFor: ["flood"],
  },
  {
    name: "성수고등학교",
    target: "4층",
    visualCue: "🏫 성수고 학교 건물", // 서울숲길 18
    lat: 37.5473571,
    lng: 127.0381343,
    suitableFor: ["flood"],
  },
  {
    name: "서울성수동우편취급국",
    target: "2층",
    visualCue: "📮 성수동 우체국", // 성수일로12길 52
    lat: 37.5466072,
    lng: 127.0562668,
    suitableFor: ["flood", "missing"],
    note: "평일 09-18시만 운영",
  },

  // ───────── 어른 상주 실내 (실종) ─────────
  {
    name: "성수지구대",
    target: "",
    visualCue: "🚔 경찰관 아저씨 있는 지구대", // 24시
    lat: 37.5481496,
    lng: 127.0551847,
    suitableFor: ["missing"],
    note: "24시",
  },
  {
    name: "성수119안전센터",
    target: "",
    visualCue: "🚒 소방차 있는 119센터", // 24시
    lat: 37.5371510,
    lng: 127.0606567,
    suitableFor: ["missing"],
    note: "24시",
  },
  {
    name: "CU 성수사랑점",
    target: "",
    visualCue: "🟦 파란 간판 씨유 편의점", // 아차산로 113, 24시
    lat: 37.5446813,
    lng: 127.0569827,
    suitableFor: ["missing"],
    note: "24시",
  },
  {
    name: "GS25 성수역점",
    target: "",
    visualCue: "🟦 지에스25 편의점", // 아차산로7길 3, 24시
    lat: 37.5457214,
    lng: 127.0539134,
    suitableFor: ["missing"],
    note: "24시",
  },
  {
    name: "GS25 성동서울숲점",
    target: "",
    visualCue: "🟦 지에스25 편의점", // 서울숲2길 41, 24시
    lat: 37.5464913,
    lng: 127.0432892,
    suitableFor: ["missing"],
    note: "24시",
  },
  {
    name: "CU 성수성문점",
    target: "",
    visualCue: "🟦 파란 간판 씨유 편의점", // 성수이로 87, 24시
    lat: 37.5428140,
    lng: 127.0562605,
    suitableFor: ["missing"],
    note: "24시",
  },
  {
    name: "서울뚝섬우체국",
    target: "",
    visualCue: "📮 뚝섬 우체국", // 뚝섬로3길 14
    lat: 37.5414003,
    lng: 127.0494910,
    suitableFor: ["missing"],
    note: "평일 09-18시만 운영",
  },
];
