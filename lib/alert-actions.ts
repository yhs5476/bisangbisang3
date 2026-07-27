export type DisasterType = "earthquake" | "flood" | "fire" | "missing";

export interface PlaceRecommendation {
  visualCue: string;   // 예: "🏫 빨간 벽돌"
  name: string;        // 예: "경동초등학교"
  targetLabel: string; // 예: "본관 4층", "운동장", "교무실"
  walkMinutes: number; // 예: 2 (걸어서 2분)
  category: string;    // 업종 카테고리
  crossesRoad: false;  // 차도 미횡단 (항상 false)
}

export interface AlertAction {
  order: 1 | 2 | 3;
  officialPrinciple: string; // 행안부 원칙 원문 (검증/감사용)
  childText: string;         // 아동용 행동 문장, 15자 이내
  icon: string;
  place?: PlaceRecommendation; // 조건 만족 후보 없으면 undefined
}

export interface DisasterDetail {
  type: DisasterType;
  label: string;       // 한 단어 라벨 ("지진", "큰비", "불", "실종")
  icon: string;
  headline: string;    // 24px 이상 안내문구 ("지금 지진이 났어요")
  alertText: string;   // 잠금화면용 안내문구
  actions: [AlertAction, AlertAction, AlertAction];
}

export const DISASTER_DATA: Record<DisasterType, DisasterDetail> = {
  earthquake: {
    type: "earthquake",
    label: "지진",
    icon: "warning",
    headline: "지금 지진이 났어요",
    alertText: "[안전안내문자] 성동구 지진 발생. 즉시 대피하세요.",
    actions: [
      {
        order: 1,
        officialPrinciple: "흔들리는 동안 튼튼한 탁자 아래로 들어가 몸을 보호합니다.",
        childText: "책상 아래로 들어가요",
        icon: "chair",
      },
      {
        order: 2,
        officialPrinciple: "탁자 다리를 꼭 잡고 머리와 목을 보호합니다.",
        childText: "머리와 목을 감싸요",
        icon: "shield",
      },
      {
        order: 3,
        officialPrinciple: "흔들림이 멈추면 운동장이나 공원 등 넓은 공터로 대피합니다.",
        childText: "흔들림이 멈추면 나가요",
        icon: "directions_run",
      },
    ],
  },
  flood: {
    type: "flood",
    label: "큰비",
    icon: "water_drop",
    headline: "지금 큰비가 와요",
    alertText: "[안전안내문자] 성동구 호우경보. 즉시 안전한 곳으로 이동하세요.",
    actions: [
      {
        order: 1,
        officialPrinciple: "침수 위험 지역 및 물이 차오르는 도로는 피합니다.",
        childText: "물이 고인 길을 피해요",
        icon: "tsunami",
      },
      {
        order: 2,
        officialPrinciple: "저지대를 벗어나 3층 이상 높은 건물 상층부로 대피합니다.",
        childText: "높은 층으로 올라가요",
        icon: "north",
      },
      {
        order: 3,
        officialPrinciple: "지하 공간을 피하고 튼튼한 건물 상층으로 대피합니다.",
        childText: "건물 위로 올라가요",
        icon: "apartment",
      },
    ],
  },
  fire: {
    type: "fire",
    label: "불",
    icon: "local_fire_department",
    headline: "지금 불이 났어요",
    alertText: "[안전안내문자] 성동구 화재 발생. 대피 후 119 신고하세요.",
    actions: [
      {
        order: 1,
        officialPrinciple: "젖은 수건이나 옷으로 코와 입을 막아 연기 흡입을 차단합니다.",
        childText: "젖은 옷으로 코를 막아요",
        icon: "masks",
      },
      {
        order: 2,
        officialPrinciple: "자세를 낮추고 비상구 유도등을 따라 외부로 탈출합니다.",
        childText: "자세를 낮추고 나가요",
        icon: "transfer_within_a_station",
      },
      {
        order: 3,
        officialPrinciple: "건물 밖 안전한 바람 반대 방향 공터로 멀리 대피합니다.",
        childText: "건물에서 멀리 떨어져요",
        icon: "directions_run",
      },
    ],
  },
  missing: {
    type: "missing",
    label: "실종",
    icon: "person_search",
    headline: "지금 길을 잃었어요",
    alertText: "[안전안내문자] 성동구 아동 길 잃음 발생. 주변 어른에게 도움을 요청하세요.",
    actions: [
      {
        order: 1,
        officialPrinciple: "길을 잃었을 때는 이동하지 않고 멈춰서 자리를 지킵니다 (멈춤).",
        childText: "멈춰서 자리를 지켜요",
        icon: "stop_circle",
      },
      {
        order: 2,
        officialPrinciple: "어른이 상주하는 밝은 실내(편의점·파출소·학교) 어른에게 도움을 청합니다 (생각).",
        childText: "주변 어른에게 말해요",
        icon: "record_voice_over",
      },
      {
        order: 3,
        officialPrinciple: "보호자의 연락처를 기억하거나 전달하여 연락을 시도합니다 (연락).",
        childText: "엄마 전화번호를 불러요",
        icon: "contact_phone",
      },
    ],
  },
};

export function getDisasterDetail(type?: string | null): DisasterDetail {
  if (type === "flood") return DISASTER_DATA.flood;
  if (type === "fire") return DISASTER_DATA.fire;
  if (type === "missing") return DISASTER_DATA.missing;
  return DISASTER_DATA.earthquake;
}
