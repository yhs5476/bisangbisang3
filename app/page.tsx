"use client";

import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { supabase } from "./supabaseClient";

type Screen =
  | "onboarding"
  | "login"
  | "home"
  | "alert"
  | "situation"
  | "actions"
  | "checkin"
  | "mission"
  | "quiz"
  | "photoReward"
  | "reward"
  | "world"
  | "safety"
  | "family"
  | "guardian";

const SAMPLE_ALERT =
  "[성동구청] 오늘 16시 호우경보 발효. 하천변, 저지대, 지하공간 출입을 자제하고 안전한 곳으로 이동하시기 바랍니다.";

const locationOptions = [
  { id: "home", icon: "⌂", label: "집", sub: "아파트·주택" },
  { id: "outside", icon: "☂", label: "이동 중", sub: "거리·대중교통" },
  { id: "underground", icon: "↓", label: "지하공간", sub: "지하철·주차장" },
];

const navItems: Array<{ screen: Screen; icon: React.ReactNode; label: string }> = [
  { screen: "home", icon: "⌂", label: "홈" },
  { screen: "mission", icon: "★", label: "미션" },
  { screen: "safety", icon: "⌖", label: "안심지도" },
  { screen: "family", icon: "♧", label: "가족" },
  {
    screen: "guardian",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block", margin: "auto" }}>
        <circle cx="5.5" cy="12" r="2.2" />
        <circle cx="12" cy="12" r="2.2" />
        <circle cx="18.5" cy="12" r="2.2" />
      </svg>
    ),
    label: "더보기",
  },
];

const quizQuestions = [
  {
    title: "지진이 나면 먼저 어디로 가야 할까요?",
    options: ["창문 가까이", "튼튼한 책상 아래", "엘리베이터 안"],
    answer: 1,
    hint: "떨어지는 물건으로부터 몸을 보호할 수 있는 곳을 떠올려봐요.",
  },
  {
    title: "책상 아래에서는 어디를 보호해야 할까요?",
    options: ["머리와 목", "신발", "가방"],
    answer: 0,
    hint: "두 팔로 가장 중요한 곳을 감싸요.",
  },
  {
    title: "흔들림이 멈춘 뒤 맞는 행동은?",
    options: ["엘리베이터 타기", "창밖으로 뛰기", "어른의 안내에 따라 이동하기"],
    answer: 2,
    hint: "혼자 서두르기보다 선생님이나 보호자의 안내를 따라요.",
  },
];

function FlameBuddy({
  size = "medium",
  mood = "happy",
}: {
  size?: "small" | "medium" | "large";
  mood?: "happy" | "proud";
}) {
  return (
    <div className={`flame-buddy flame-${size} mood-${mood}`} aria-hidden="true">
      <MascotImage className="flame-buddy-img" />
    </div>
  );
}

function MascotImage({
  className = "",
  alt = "밝게 웃는 불 캐릭터 불이",
}: {
  className?: string;
  alt?: string;
}) {
  return <img className={`mascot-image ${className}`} src="/assets/fire-character.png?v=4" alt={alt} />;
}

function BackHeader({
  title,
  onBack,
  tone = "default",
}: {
  title: string;
  onBack: () => void;
  tone?: "default" | "emergency";
}) {
  return (
    <header className={`sub-header ${tone === "emergency" ? "emergency-header" : ""}`}>
      <button className="icon-button back-button" onClick={onBack} aria-label="뒤로 가기">
        <span className="material-symbols-rounded back-icon">arrow_back_ios_new</span>
      </button>
      <strong>{title}</strong>
      <span className="header-spacer" />
    </header>
  );
}

function BottomNav({
  current,
  onNavigate,
}: {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {navItems.map((item) => (
        <button
          key={item.screen}
          className={current === item.screen ? "active" : ""}
          onClick={() => onNavigate(item.screen)}
          aria-current={current === item.screen ? "page" : undefined}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export const ALL_CHARACTERS = [
  { name: "불이 (씨앗)", level: "Lv. 1", attr: "💧 씨앗 불꽃 폼", category: "fire", rarity: "R", src: "/assets/fire-character-seed.png?v=10", desc: "물방울처럼 맑은 불씨 씨앗 형태의 순수한 아기 정령!", skill: "안전 씨앗 발아 & 기초 가이드" },
  { name: "불이 (별 뱃지)", level: "Lv. 2", attr: "⭐ 별 뱃지 폼", category: "fire", rarity: "R", src: "/assets/fire-character-star.png?v=10", desc: "미션 완료 별 뱃지를 가슴에 달고 안전을 가이드하는 불꽃 수호자!", skill: "미션 칭찬 별빛 & 안전 보상 수여" },
  { name: "불이 (방패 뱃지)", level: "Lv. 2", attr: "🛡️ 방패 뱃지 폼", category: "fire", rarity: "R", src: "/assets/fire-character-shield.png?v=10", desc: "황금 방재 쉴드 뱃지를 착용하고 화재 예방을 책임지는 불꽃 정령!", skill: "황금 방재 방패 쉴드 & 안전 수칙 알림" },
  { name: "불이 (기본)", level: "Lv. 2", attr: "🔥 화재·열파 전담", category: "fire", rarity: "N", src: "/assets/fire-character.png?v=9", desc: "소화기 사용법과 화재 대피 신호를 알려주는 따뜻하고 용감한 불꽃 친구!", skill: "화재 안전 대피 지도 & 불씨 모으기" },
  { name: "불이 (적염 전사)", level: "Lv. 2", attr: "🥊 용맹한 적염 격투가", category: "fire", rarity: "SR", src: "/assets/fire-character-red-fighter.png?v=9", desc: "화재 현장에서 굳센 주먹을 쥐고 대피를 리드하는 용맹한 적염 전사!", skill: "비상문 개척 & 화재 통로 펀치" },
  { name: "불이 (적염 망토)", level: "Lv. 3", attr: "🦸‍♂️ 적염 망토 수호자", category: "fire", rarity: "SR", src: "/assets/fire-character-red-hero.png?v=9", desc: "붉은 망토를 휘날리며 열파와 폭발 재난으로부터 생명을 구하는 적염 수호자!", skill: "열파 돌풍 케이지 & 인명 구조 알림" },
  { name: "불이 (청염 스파크)", level: "Lv. 3", attr: "✨ 푸른 불꽃 각성", category: "fire", rarity: "SR", src: "/assets/fire-character-blue-sparkle.png?v=9", desc: "고온 청염 불씨 스파크를 튀기며 최첨단 가스 안전 감지를 선도하는 불꽃 폼!", skill: "청염 가스 누출 센서 & 고온 차단막" },
  { name: "불이 (각성)", level: "Lv. 4", attr: "🦸‍♂️ 푸른 망토 불꽃 대장", category: "fire", rarity: "SSR", src: "/assets/fire-character-hero.png?v=9", desc: "영웅의 보석과 푸른 오라 망토를 두른 화재 안전 수호대장의 최종 진화 모습!", skill: "광역 화재 차단막 & 소화제 세례" },
  { name: "불이 (울먹)", level: "Special", attr: "💧 슬픈 불꽃 폼", category: "fire", rarity: "N", src: "/assets/fire-character-sad.png?v=9", desc: "화재 안전 대피 수칙을 어겼을 때 기운 없이 불씨가 사그라들며 울먹이는 불이!", skill: "화재 위험 알림 소환" },
  { name: "물이 (기본)", level: "Lv. 1", attr: "💧 침수·태풍 전담", category: "water", rarity: "N", src: "/assets/water-character.png?v=7", desc: "침수 위험 지역 대피와 안전 물자 준비를 상냥하게 안내해 주는 시원한 수호자!", skill: "침수 대비 높은 곳 대피 가이드" },
  { name: "물이 (성장)", level: "Lv. 2", attr: "🌊 도약하는 수룡 폼", category: "water", rarity: "SR", src: "/assets/water-character-lv2.png?v=7", desc: "침수 지역 방파제 보호 및 빠른 상륙 대피를 돕는 시원한 파도 폼!", skill: "수위 감지 알림 & 빠른 상륙 대피" },
  { name: "물이 (각성)", level: "Lv. 3", attr: "🧜‍♂️ 웅장한 물의 정령", category: "water", rarity: "SSR", src: "/assets/water-character-spirit.png?v=7", desc: "물줄기 쉴드를 두르고 대홍수 재난으로부터 사람들을 수호하는 물의 정령 최종 진화 모습!", skill: "해일 방파 차단막 & 정수 쉴드" },
  { name: "물이 (울먹)", level: "Special", attr: "💧 슬픈 물방울 폼", category: "water", rarity: "N", src: "/assets/water-character-sad.png?v=7", desc: "침수 안전 대피 규칙을 잊었을 때 눈물을 퐁당 글썽이는 솔직한 물이!", skill: "침수 위험 경보 발행" },
  { name: "바람이 (기본)", level: "Lv. 1", attr: "🌬️ 강풍·황사 전담", category: "wind", rarity: "N", src: "/assets/wind-character.png?v=6", desc: "창문 고정 및 미세먼지 마스크 착용을 꼼꼼하게 챙겨주는 상쾌한 바람 파트너!", skill: "강풍 방재 대비 및 실내 환기 조율" },
  { name: "바람이 (성장)", level: "Lv. 2", attr: "🌀 날카로운 쾌속 바람", category: "wind", rarity: "SR", src: "/assets/wind-character-lv2.png?v=6", desc: "강풍 재난 시 미세먼지와 황사를 날려버리는 강력한 쾌속 윈드 폼!", skill: "창문 강화 테이핑 & 대공 환기 쉴드" },
  { name: "바람이 (각성)", level: "Lv. 3", attr: "🌪️ 웅장한 바람 정령", category: "wind", rarity: "SSR", src: "/assets/wind-character-spirit.png?v=6", desc: "회오리바람 쉴드를 장착한 태풍 대비 전담 수호 정령의 최종 진화 모습!", skill: "태풍 충격 완화 윈드 케이지" },
  { name: "바람이 (울먹)", level: "Special", attr: "💧 슬픈 구름바람 폼", category: "wind", rarity: "N", src: "/assets/wind-character-sad.png?v=6", desc: "바람 안전 주의사항을 어겼을 때 기운 없이 눈물을 글썽이는 서운한 바람이!", skill: "미세먼지 주의보 경보 발행" },
  { name: "땅이 (기본)", level: "Lv. 1", attr: "🪵 지진·산사태 전담", category: "earth", rarity: "N", src: "/assets/earth-character.png?v=5", desc: "지진 발생 시 책상 아래로 몸을 숨기고 머리를 보호하도록 든든하게 지켜주는 대지 수호신!", skill: "지진 3단계 안전 자세(드롭, 커버, 홀드 온)" },
  { name: "땅이 (성장)", level: "Lv. 2", attr: "🗿 단단한 흙바위 폼", category: "earth", rarity: "SR", src: "/assets/earth-character-lv2.png?v=5", desc: "지진과 산사태 위험에서 흔들리지 않고 더 단단하게 몸을 보호하는 진화 폼!", skill: "바위 방패 내진 보강 지식" },
  { name: "땅이 (각성)", level: "Lv. 3", attr: "🌋 웅장한 대지 골렘", category: "earth", rarity: "SSR", src: "/assets/earth-character-golem.png?v=5", desc: "모든 지진 미션을 완수한 강력한 보석 결정과 이끼 갑옷의 최종 진화 모습!", skill: "대지 충격파 흡수 & 광역 수호 쉴드" },
  { name: "땅이 (아기)", level: "Baby", attr: "🌱 아기 흙방울 폼", category: "earth", rarity: "R", src: "/assets/earth-character-baby.png?v=5", desc: "새싹을 틔우며 귀엽게 웃고 있는 초보 안전 훈련생 시절의 땅이!", skill: "앙증맞은 안전 인사 & 기초 훈련" },
  { name: "땅이 (울먹)", level: "Special", attr: "💧 슬픈 흙공 폼", category: "earth", rarity: "N", src: "/assets/earth-character-sad.png?v=5", desc: "안전 규칙을 지키지 않았을 때 눈물을 핑 글썽이는 솔직한 표정의 땅이!", skill: "안전 주의 경고 알림" },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login");
  const [alertText, setAlertText] = useState("");
  const [alertError, setAlertError] = useState(false);
  const [location, setLocation] = useState("home");
  const [withChild, setWithChild] = useState<"yes" | "no">("no");
  const [checks, setChecks] = useState([false, false, false, false]);
  const [missionHeroImage, setMissionHeroImage] = useState<string | null>("/assets/mission-initial-hero.jpg");
  const [profileAvatarSrc, setProfileAvatarSrc] = useState<string | null>(null);
  const [userName, setUserName] = useState("도도");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showCodexModal, setShowCodexModal] = useState(false);
  const [selectedCodexName, setSelectedCodexName] = useState<string>("불이");
  const [codexCategory, setCodexCategory] = useState<"all" | "fire" | "water" | "wind" | "earth">("all");
  const [fireForm, setFireForm] = useState<{ name: string; src: string; level: string }>({
    name: "불이",
    src: "/assets/fire-character.png?v=9",
    level: "Lv. 2",
  });
  const [waterForm, setWaterForm] = useState<{ name: string; src: string; level: string }>({
    name: "물이",
    src: "/assets/water-character.png?v=7",
    level: "Lv. 1",
  });
  const [windForm, setWindForm] = useState<{ name: string; src: string; level: string }>({
    name: "바람이",
    src: "/assets/wind-character.png?v=6",
    level: "Lv. 1",
  });
  const [earthForm, setEarthForm] = useState<{ name: string; src: string; level: string }>({
    name: "땅이",
    src: "/assets/earth-character.png?v=5",
    level: "Lv. 1",
  });
  const [sparks, setSparks] = useState(50);
  const [missionDone, setMissionDone] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [role, setRole] = useState<"guardian" | "child">("guardian");
  const [checkinSent, setCheckinSent] = useState(false);

  // Auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Revamped Gacha & Reward states
  const [gachaTickets, setGachaTickets] = useState(55);
  const [rewardPoints, setRewardPoints] = useState(1200);
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>([
    "불이 (기본)",
    "물이 (기본)",
    "바람이 (기본)",
    "땅이 (기본)",
  ]);
  const [claimedCodexRewards, setClaimedCodexRewards] = useState<string[]>([]);
  const [rewardSubTab, setRewardSubTab] = useState<"gacha" | "codex" | "points" | "shop">("gacha");
  const [gachaResult, setGachaResult] = useState<{
    characters: Array<(typeof ALL_CHARACTERS)[0] & { isNew: boolean }>;
    isTen: boolean;
  } | null>(null);
  const [isGachaAnimating, setIsGachaAnimating] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);

  // Daily 1-time reward limit states (1일 1회 불씨 수급 제한)
  const [dailyMissionRewarded, setDailyMissionRewarded] = useState(false);
  const [dailyQuizRewarded, setDailyQuizRewarded] = useState(false);

  const handleDrawGacha = (count: 1 | 10) => {
    if (gachaTickets < count) {
      alert(`뽑기 티켓이 부족합니다! (필요: 🎟️ ${count}장, 보유: 🎟️ ${gachaTickets}장)\n불씨 상점에서 티켓을 먼저 교환해 보세요.`);
      return;
    }
    setGachaTickets((prev) => prev - count);
    setIsGachaAnimating(true);
    setGachaResult(null);

    setTimeout(() => {
      const drawnList: Array<(typeof ALL_CHARACTERS)[0] & { isNew: boolean }> = [];
      const currentUnlocked = [...unlockedCharacters];
      let gainedSparksFromDupes = 0;

      for (let i = 0; i < count; i++) {
        const rand = Math.random() * 100;
        let targetRarity = "N";
        if (rand < 5) targetRarity = "SSR";
        else if (rand < 25) targetRarity = "SR";
        else if (rand < 60) targetRarity = "R";
        else targetRarity = "N";

        const pool = ALL_CHARACTERS.filter((c) => c.rarity === targetRarity);
        const picked = pool[Math.floor(Math.random() * pool.length)] || ALL_CHARACTERS[0];

        const isNew = !currentUnlocked.includes(picked.name);
        if (isNew) {
          currentUnlocked.push(picked.name);
        } else {
          gainedSparksFromDupes += 20;
        }
        drawnList.push({ ...picked, isNew });
      }

      setUnlockedCharacters(currentUnlocked);
      if (gainedSparksFromDupes > 0) {
        setSparks((prev) => prev + gainedSparksFromDupes);
      }
      setGachaResult({ characters: drawnList, isTen: count === 10 });
      setIsGachaAnimating(false);
      triggerFireworks();
    }, 1000);
  };

  const handleBuyTickets = (count: 1 | 10) => {
    const cost = count === 1 ? 100 : 900;
    if (sparks < cost) {
      alert(`불씨가 부족합니다! (필요: 🔥 ${cost}개, 보유: 🔥 ${sparks}개)\n미션과 퀴즈를 풀고 불씨를 모아보세요.`);
      return;
    }
    setSparks((prev) => prev - cost);
    setGachaTickets((prev) => prev + count);
    triggerFireworks();
    setRewardNotice(`🎟️ 뽑기 티켓 ${count}장을 성공적으로 구매했습니다!`);
    setTimeout(() => setRewardNotice(null), 3000);
  };

  const handleClaimCodexReward = (rewardId: string, pts: number, title: string) => {
    if (claimedCodexRewards.includes(rewardId)) return;
    setClaimedCodexRewards((prev) => [...prev, rewardId]);
    setRewardPoints((prev) => prev + pts);
    triggerFireworks();
    setRewardNotice(`🎉 '${title}' 수집 보상으로 ${pts.toLocaleString()} Pts를 획득했습니다!`);
    setTimeout(() => setRewardNotice(null), 3500);
  };

  const completedChecks = checks.filter(Boolean).length;
  const progress = Math.round((completedChecks / checks.length) * 100);

  const selectedLocation = useMemo(
    () => locationOptions.find((item) => item.id === location),
    [location],
  );

  const navigate = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const triggerFireworks = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        decay: 0.92,
        scalar: 1.2,
        origin: { y: 0.5 },
      });
    }, 500);
  };

  const openCheckin = () => {
    setCheckinSent(true);
    navigate("checkin");
  };

  const analyzeAlert = () => {
    if (!alertText.trim()) {
      setAlertError(true);
      return;
    }
    setAlertError(false);
    navigate("situation");
  };

  const toggleCheck = (index: number) => {
    if (index === 0) {
      setMissionHeroImage("/assets/mission-desk-find.jpg");
    } else if (index === 1) {
      setMissionHeroImage("/assets/mission-crouch-enter.png");
    } else if (index === 2) {
      setMissionHeroImage("/assets/mission-photo-take.png");
    } else if (index === 3) {
      setMissionHeroImage("/assets/mission-protect-head.png");
    }
    setChecks((current) =>
      current.map((checked, itemIndex) => (itemIndex === index ? !checked : checked)),
    );
  };

  const completeMission = () => {
    if (completedChecks !== checks.length) return;
    navigate("photoReward");
  };

  const finishMissionReward = () => {
    if (dailyMissionRewarded) {
      setRewardNotice("ℹ️ 오늘 미션 완료 불씨 보상은 이미 수령하셨습니다. (내일 다시 도전해 주세요!)");
    } else {
      const earnedSparks = 30;
      setSparks((current) => current + earnedSparks);
      setDailyMissionRewarded(true);
      setRewardNotice(`🎉 축하합니다! 오늘 미션 완수 보상으로 불씨 🔥 +${earnedSparks}개를 획득했습니다!`);
      triggerFireworks();
    }
    setTimeout(() => {
      setRewardNotice(null);
    }, 4500);
    navigate("reward");
  };

  const finishQuizReward = () => {
    if (dailyQuizRewarded) {
      setRewardNotice("ℹ️ 오늘 퀴즈 완료 불씨 보상은 이미 수령하셨습니다. (내일 새로운 퀴즈로 도전해 주세요!)");
    } else {
      const earnedSparks = 30;
      setSparks((current) => current + earnedSparks);
      setDailyQuizRewarded(true);
      setRewardNotice(`🎉 축하합니다! 오늘 안전 퀴즈 완수 보상으로 불씨 🔥 +${earnedSparks}개를 획득했습니다!`);
      triggerFireworks();
    }
    setTimeout(() => {
      setRewardNotice(null);
    }, 4500);
    navigate("reward");
  };

  const handlePhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUserPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <main className="site-stage">
      <div className="ambient-shape ambient-one" />
      <div className="ambient-shape ambient-two" />
      <section className={`phone-shell screen-${screen}`}>
        <div className="status-bar" aria-hidden="true">
          <span>● ◒ ▰</span>
          <span>9:41</span>
        </div>

        {screen === "onboarding" && (
          <div className="screen-content onboarding-screen">
            <header className="onboarding-brand">
              <div className="brand-lockup">
                <img src="/assets/logo-bisang.png" alt="비상비상" className="brand-logo-img" />
              </div>
              <span>성동구 맞춤 가족 안전 앱</span>
            </header>

            <section className="onboarding-hero">
              <span className="onboarding-halo" />
              <MascotImage className="onboarding-mascot" />
              <span className="orbit-badge orbit-home">⌂</span>
              <span className="orbit-badge orbit-school">▤</span>
              <span className="orbit-badge orbit-heart">♥</span>
            </section>

            <section className="onboarding-copy">
              <span className="eyebrow">우리 가족의 안전 습관</span>
              <h1>위급할 땐 바로 행동하고,<br />평소에는 재밌게 연습해요</h1>
              <p>성동구의 익숙한 생활공간을 탐험하며 아이 스스로 안전 행동을 기억하게 도와줘요.</p>
            </section>

            <fieldset className="role-selector">
              <legend>누구로 시작할까요?</legend>
              <button
                className={role === "guardian" ? "selected" : ""}
                onClick={() => setRole("guardian")}
                type="button"
              >
                <span className="role-avatar guardian-avatar">민</span>
                <span><strong>김민지 보호자</strong><small>아이의 위치와 안전 상태를 확인해요</small></span>
                <i />
              </button>
              <button
                className={role === "child" ? "selected" : ""}
                onClick={() => setRole("child")}
                type="button"
              >
                <span className="role-avatar child-avatar">{userName[0] || "도"}</span>
                <span><strong>{userName} 어린이</strong><small>미션으로 안전 행동을 연습해요</small></span>
                <i />
              </button>
            </fieldset>

            <aside className="permission-preview">
              <span>🔒</span>
              <div>
                <strong>위치 및 알림 권한 허용 필요</strong>
                <small>가족 안전 및 위치 기반 대피 가이드를 제공합니다.</small>
              </div>
            </aside>

            <button className="primary-button full-width" type="button" onClick={() => navigate("home")}>
              {role === "guardian" ? "보호자 모드로 시작하기" : `${userName} 어린이 모드로 시작하기`}
            </button>
          </div>
        )}

        {screen === "login" && (
          <div className="screen-content login-screen">
            <BackHeader title="로그인 / 회원가입" onBack={() => navigate("onboarding")} />
            
            <div className="login-hero">
              <MascotImage className="login-mascot" alt="비상비상 마스코트" />
              <h2>우리 가족 안전 맞춤 서비스</h2>
              <p>이메일이나 간편 계정으로 시작해 보세요</p>
            </div>

            <form
              className="login-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthLoading(true);
                setAuthError("");
                try {
                  if (isSignUp) {
                    const { error } = await supabase.auth.signUp({
                      email,
                      password,
                    });
                    if (error) throw error;
                    setAuthSuccess("회원가입 확인 메일을 전송했거나 계정이 생성되었습니다!");
                  } else {
                    const { error } = await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });
                    if (error) throw error;
                    navigate("home");
                  }
                } catch (err: unknown) {
                  setAuthError(err instanceof Error ? err.message : "인증 중 오류가 발생했습니다.");
                } finally {
                  setAuthLoading(false);
                }
              }}
            >
              <div className="input-group">
                <label htmlFor="auth-email">이메일 주소</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="auth-password">비밀번호</label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {authError && <div className="auth-message error-message">{authError}</div>}
              {authSuccess && <div className="auth-message success-message">{authSuccess}</div>}

              <button className="primary-button wide" type="submit" disabled={authLoading}>
                {authLoading ? "처리 중..." : isSignUp ? "회원가입 완료" : "로그인하기"}
              </button>
            </form>

            <div className="auth-toggle">
              <span>{isSignUp ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                {isSignUp ? "로그인하기" : "회원가입하기"}
              </button>
            </div>
          </div>
        )}

        {screen === "home" && (
          <div className="screen-content home-screen">
            <header className="home-header">
              <div>
                <div className="brand-lockup">
                  <img src="/assets/logo-bisang.png" alt="비상비상" className="brand-logo-img" />
                </div>
                <button className="location-pill" aria-label="생활 지역 설정">
                  {role === "guardian" ? "김민지 보호자" : `${userName} 어린이`} · 성수동 <span>⌄</span>
                </button>
              </div>
              <button className="icon-button notification-button" aria-label="리워드 보상 센터" onClick={() => navigate("reward")}>
                ♢
                <span className="notification-dot" />
              </button>
            </header>

            {/* 1-Click 안부 보내기 */}
            <button
              className={`one-click-checkin ${checkinSent ? "sent" : ""}`}
              onClick={openCheckin}
            >
              <span className="checkin-heart">{checkinSent ? "✓" : "♥"}</span>
              <span>
                <strong>{checkinSent ? "안전 알림을 보냈어요" : "1‑Click 안부 보내기"}</strong>
                <small>{role === "guardian" ? `${userName}에게 안부 확인을 요청해요` : "보호자에게 지금 안전하다고 알려요"}</small>
              </span>
              <span>›</span>
            </button>

            {/* 오늘의 1분 안전 퀴즈 섹션 */}
            <section className="quiz-preview-section">
              <div className="quiz-section-header">
                <h2>오늘의 1분 안전 퀴즈</h2>
                <button className="see-all-btn" onClick={() => navigate("quiz")}>
                  전체보기
                </button>
              </div>
              <div className="quiz-preview-card">
                <span className="quiz-badge">상황 퀴즈</span>
                <p className="quiz-question-text">
                  호우경보가 내려졌을 때, 지하주차장에 차를 두었다면 가장 먼저 할 행동은?
                </p>
                <button
                  className="quiz-action-button"
                  style={dailyQuizRewarded ? { background: "#e8f2ee", color: "#1b4035", borderColor: "#b8d5c8" } : {}}
                  onClick={() => navigate("quiz")}
                >
                  {dailyQuizRewarded ? "✓ 오늘 퀴즈 완료 (보상 획득됨)" : "퀴즈 풀고 불씨 키우기"}
                </button>
              </div>
            </section>

            <div className="section-heading">
              <div>
                <span className="eyebrow">오늘의 안전 습관</span>
                <h2>{userName}와(과) 불씨를 밝혀볼까요?</h2>
              </div>
              <span className="streak-pill">🔥 3일째</span>
            </div>

            <section className="mission-card" onClick={() => navigate("mission")}>
              <div className="mission-card-copy">
                <span className="mission-tag">집에서 · 약 5분</span>
                <h3>책상 아래 안전 자세 연습</h3>
                <p>지진이 나면 머리를 보호하고 책상 아래로 숨는 자세를 연습해요.</p>
                <div className="reward-row">
                  <span className="spark-token">{dailyMissionRewarded ? "✓" : "✦"}</span>
                  <strong>{dailyMissionRewarded ? "오늘 미션 보상 완료" : "불씨 30개"}</strong>
                  <span className="mission-arrow">›</span>
                </div>
              </div>
              <div className="mission-character-wrap">
                <span className="character-speech">같이 해요!</span>
                <MascotImage className="home-mascot" />
              </div>
            </section>

            <section className="spark-progress-card">
              <div className="spark-status">
                <span className="spark-orb">✦</span>
                <div>
                  <small>우리 집 안전불</small>
                  <strong>{sparks} / 100 불씨</strong>
                </div>
                <span className="level-label">Lv. 2 작은 불씨</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${Math.min(sparks, 100)}%` }} />
              </div>
            </section>

            <button className="world-preview" onClick={() => navigate("world")}>
              <div>
                <span className="eyebrow">우리 동네 안전 월드</span>
                <strong>성수동에 불을 밝혀주세요</strong>
              </div>
              <div className="mini-map" aria-hidden="true">
                <span className="map-road road-one" />
                <span className="map-road road-two" />
                <span className="map-pin pin-home">⌂</span>
                <span className="map-pin pin-school">▤</span>
                <span className="map-pin pin-park">♧</span>
              </div>
            </button>

            {/* 재난상황 시뮬레이션 이동 버튼 */}
            <button
              className="primary-button wide"
              style={{
                marginTop: "16px",
                backgroundColor: "#e95042",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "16px",
                fontWeight: "800",
                boxShadow: "0 6px 16px rgba(233, 80, 66, 0.35)",
              }}
              onClick={() => {
                window.location.href = "/demo/lock";
              }}
            >
              <span className="material-symbols-rounded">warning</span>
              <span>재난상황 시뮬레이션</span>
            </button>
          </div>
        )}

        {screen === "alert" && (
          <div className="screen-content alert-input-screen">
            <BackHeader title="재난문자 확인" onBack={() => navigate("home")} />
            <section className="flow-intro">
              <span className="step-label">1 / 2</span>
              <h1>받은 재난문자를<br />그대로 붙여주세요</h1>
              <p>필요한 내용만 골라 우리 가족이 지금 할 일로 바꿔드릴게요.</p>
            </section>

            <label className={`message-input ${alertError ? "has-error" : ""}`}>
              <span>재난문자 내용</span>
              <textarea
                value={alertText}
                onChange={(event) => {
                  setAlertText(event.target.value);
                  setAlertError(false);
                }}
                placeholder="[성동구청] 받은 문자 내용을 여기에 붙여주세요."
                maxLength={500}
              />
              <small>{alertText.length} / 500</small>
            </label>
            {alertError && <p className="form-error">받은 문자를 붙여넣거나 예시를 불러와주세요.</p>}

            <button
              className="sample-button"
              onClick={() => {
                setAlertText(SAMPLE_ALERT);
                setAlertError(false);
              }}
            >
              <span className="sample-icon">
                <span className="material-symbols-rounded">notifications_active</span>
              </span>
              <span>
                <strong>지금 울린 재난알림 문자 불러오기</strong>
                <small>프로토타입을 바로 체험해보세요</small>
              </span>
              <span>＋</span>
            </button>

            <aside className="safety-note">
              <span>i</span>
              <p>비상비상은 공식 재난정보를 이해하기 쉽게 정리해요. 실제 상황에서는 119·112와 관계기관의 안내를 우선해주세요.</p>
            </aside>

            <div className="sticky-action">
              <button className="primary-button" onClick={analyzeAlert}>
                문자 내용 확인하기 <span>→</span>
              </button>
            </div>
          </div>
        )}

        {screen === "situation" && (
          <div className="screen-content situation-screen">
            <BackHeader title="현재 상황 확인" onBack={() => navigate("alert")} />
            <section className="flow-intro compact">
              <span className="step-label">2 / 2</span>
              <h1>지금 상황을 알려주세요</h1>
              <p>두 가지만 확인하면 필요한 행동을 더 정확하게 보여드릴 수 있어요.</p>
            </section>

            <article className="parsed-alert">
              <div className="parsed-icon">☂</div>
              <div>
                <span>성동구 · 오늘 16:00</span>
                <strong>호우경보가 내려졌어요</strong>
                <p>하천변과 지하공간을 피하고 안전한 실내로 이동하세요.</p>
              </div>
              <span className="verified-badge">확인됨</span>
            </article>

            <fieldset className="option-fieldset">
              <legend>지금 어디에 있나요?</legend>
              <div className="location-grid">
                {locationOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={location === option.id ? "selected" : ""}
                    onClick={() => setLocation(option.id)}
                  >
                    <span className="location-icon">{option.icon}</span>
                    <strong>{option.label}</strong>
                    <small>{option.sub}</small>
                    <span className="radio-dot" />
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="option-fieldset">
              <legend>아이와 함께 있나요?</legend>
              <div className="segment-control">
                <button
                  type="button"
                  className={withChild === "yes" ? "selected" : ""}
                  onClick={() => setWithChild("yes")}
                >
                  함께 있어요
                </button>
                <button
                  type="button"
                  className={withChild === "no" ? "selected" : ""}
                  onClick={() => setWithChild("no")}
                >
                  떨어져 있어요
                </button>
              </div>
            </fieldset>

            <div className="sticky-action">
              <button className="primary-button" onClick={() => navigate("actions")}>
                지금 할 일 확인하기 <span>→</span>
              </button>
            </div>
          </div>
        )}

        {screen === "actions" && (
          <div className="screen-content actions-screen">
            <BackHeader title="호우경보 행동 안내" onBack={() => navigate("situation")} tone="emergency" />
            <section className="emergency-summary">
              <div className="weather-symbol" aria-hidden="true">
                <span>☂</span>
              </div>
              <span className="live-badge"><i /> 성동구 호우경보</span>
              <h1>지금은 이 3가지만<br />먼저 확인하세요</h1>
              <p>
                {selectedLocation?.label} · 아이와 {withChild === "yes" ? "함께 있음" : "떨어져 있음"}
              </p>
            </section>

            <section className="action-list" aria-label="지금 할 일">
              <article>
                <span className="action-number">1</span>
                <div>
                  <span className="action-kicker">지금 하기</span>
                  <h2>
                    {location === "underground"
                      ? "지하공간에서 지상으로 이동하세요"
                      : location === "outside"
                        ? "하천변과 낮은 길을 피해 실내로 이동하세요"
                        : "창문을 닫고 낮은 곳의 물건을 옮기세요"}
                  </h2>
                  <p>침수된 길이나 물이 차오르는 공간에는 들어가지 마세요.</p>
                </div>
                <span className="action-check">✓</span>
              </article>

              <article>
                <span className="action-number">2</span>
                <div>
                  <span className="action-kicker">아이 확인하기</span>
                  <h2>
                    {withChild === "yes"
                      ? "아이를 창문과 출입구에서 떨어뜨려 주세요"
                      : "학교·학원의 공식 연락망부터 확인하세요"}
                  </h2>
                  <p>
                    {withChild === "yes"
                      ? "함께 안전한 실내에 머물며 최신 안내를 확인하세요."
                      : "아이에게 직접 이동하라고 하기보다 기관의 보호 안내를 먼저 따라주세요."}
                  </p>
                </div>
                <span className="action-check">✓</span>
              </article>

              <article>
                <span className="action-number">3</span>
                <div>
                  <span className="action-kicker">계속 확인하기</span>
                  <h2>성동구의 최신 통제정보를 확인하세요</h2>
                  <p>상황이 바뀔 수 있어 재난문자와 공식 안내를 계속 살펴보세요.</p>
                </div>
                <span className="action-check">✓</span>
              </article>
            </section>

            <aside className="danger-note">
              <strong>하지 마세요</strong>
              <p>침수된 도로·지하차도·하천 산책로로 이동하지 마세요.</p>
            </aside>

            <div className="emergency-links">
              <button><span>☎</span> 119 긴급전화</button>
              <button><span>↗</span> 공식 행동요령</button>
            </div>

            <p className="source-note">출처: 행정안전부 국민행동요령 · 정보 예시 화면</p>
            <button
              className="primary-button emergency-safe-button"
              onClick={openCheckin}
            >
              <span>♥</span> 보호자에게 ‘안전해요’ 보내기
            </button>
            <button className="text-button" onClick={() => navigate("home")}>
              행동 안내만 확인했어요
            </button>
          </div>
        )}

        {screen === "checkin" && (
          <div className="screen-content checkin-screen">
            <BackHeader title="1‑Click 안부" onBack={() => navigate("home")} />
            <section className="checkin-success">
              <span className="checkin-ripple ripple-one" />
              <span className="checkin-ripple ripple-two" />
              <span className="big-heart">♥</span>
              <span className="success-badge">전송 완료</span>
              <h1>{role === "guardian" ? `${userName}에게 안부 확인을 보냈어요` : "엄마에게 ‘안전해요’를 보냈어요"}</h1>
              <p>{role === "guardian" ? `${userName}(이)가 답하면 가족 화면에서 바로 알려드릴게요.` : "김민지 보호자의 휴대폰에 지금 위치와 안전 상태가 전달됐어요."}</p>
            </section>

            <section className="checkin-detail-card">
              <div className="family-avatar-pair">
                <span className="role-avatar child-avatar">{userName[0] || "도"}</span>
                <span className="status-online" />
              </div>
              <div>
                <small>{userName} · 초등학교 2학년</small>
                <strong>성수초등학교 돌봄교실</strong>
                <span>방금 전 · 안전 상태 확인됨</span>
              </div>
              <span className="safe-state">안전</span>
            </section>

            <aside className="safety-note">
              <span>i</span>
              <p>이 화면은 MVP 시뮬레이션이에요. 실제 문자나 알림은 전송되지 않아요.</p>
            </aside>

            <div className="checkin-reward-mini">
              <span className="spark-orb">✦</span>
              <p><strong>안부 확인 보상 +10</strong><br />위급할 때 가족에게 상태를 알리는 습관을 만들어요.</p>
            </div>

            <button className="primary-button" onClick={() => navigate("family")}>
              가족 상태 확인하기 <span>→</span>
            </button>
          </div>
        )}

        {screen === "mission" && (
          <div className="screen-content mission-screen">
            <BackHeader title="오늘의 안전 미션" onBack={() => navigate("home")} />

            <section className="mission-hero">
              <div className="mission-hero-art" aria-hidden="true">
                {missionHeroImage ? (
                  <img src={missionHeroImage} alt="미션 히로 이미지" className="hero-banner-image" />
                ) : (
                  <>
                    <span className="floor-line" />
                    <span className="shoe obstacle-one">◇</span>
                    <span className="box obstacle-two">□</span>
                    <FlameBuddy size="large" />
                  </>
                )}
              </div>
              <span className="mission-tag">집에서 · 약 5분</span>
              <h1>책상 아래<br />안전 자세 연습</h1>
              <p>지진이 나면 머리와 몸을 보호할 수 있도록 가족과 함께 안전 자세를 연습해요.</p>
            </section>

            <section className="mission-progress">
              <div>
                <strong>미션 진행률</strong>
                <span>{completedChecks} / {checks.length} 완료</span>
              </div>
              <div className="progress-track mission-track">
                <span style={{ width: `${progress}%` }} />
              </div>
            </section>

            <section className="checklist-section">
              <h2>하나씩 함께 해봐요</h2>
              {[
                {
                  title: "튼튼한 책상 찾기",
                  copy: "몸을 숨길 수 있는 튼튼한 책상의 위치를 확인해요.",
                  icon: "▱",
                },
                {
                  title: "몸을 낮추고 들어가기",
                  copy: "서두르지 않고 몸을 낮춰 책상 아래로 들어가요.",
                  icon: "↓",
                },
                {
                  title: "미션 중인 내 사진 찍기",
                  copy: "안전 자세를 취하는 내 모습을 사진으로 찰칵 남겨요.",
                  icon: "📷",
                  isPhoto: true,
                },
                {
                  title: "머리와 목 보호하기",
                  copy: "두 팔로 머리와 목을 감싸고 책상 다리를 잡아요.",
                  icon: "○",
                },
              ].map((item, index) => (
                <div key={item.title} className="check-item-wrapper">
                  <button
                    className={`check-item ${checks[index] ? "checked" : ""}`}
                    onClick={() => toggleCheck(index)}
                    aria-pressed={checks[index]}
                  >
                    <span className="check-illustration">{item.icon}</span>
                    <span className="check-copy">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%" }}>
                        <strong>{item.title}</strong>
                        {item.isPhoto && (
                          <label
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              padding: "2px 8px",
                              borderRadius: 8,
                              background: "#e8f5e9",
                              color: "#2e7d32",
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              flexShrink: 0,
                              whiteSpace: "nowrap"
                            }}
                          >
                            📷 {userPhoto ? "사진 변경" : "사진 등록"}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  handlePhoto(file);
                                  if (!checks[index]) toggleCheck(index);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <small>{item.copy}</small>
                    </span>
                    {item.isPhoto && userPhoto ? (
                      <span className="checkbox photo-preview-box">
                        <img src={userPhoto} alt="촬영된 사진" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }} />
                      </span>
                    ) : (
                      <span className="checkbox">{checks[index] ? "✓" : ""}</span>
                    )}
                  </button>
                </div>
              ))}
            </section>

            <aside className="guardian-tip">
              <span>♥</span>
              <p><strong>보호자 팁</strong> 실제 흔들림을 재현하지 말고 아이가 자세만 천천히 따라 하도록 도와주세요.</p>
            </aside>

            <div className="sticky-action">
              <button
                className="primary-button reward-button"
                disabled={completedChecks !== checks.length}
                onClick={completeMission}
              >
                {completedChecks === checks.length ? "나의 사진 퍼즐 만들기" : `${checks.length - completedChecks}개 더 완료해주세요`}
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {screen === "quiz" && (
          <div className="screen-content quiz-screen">
            <BackHeader title="안전 퀴즈" onBack={() => navigate("home")} />
            <div className="quiz-progress-dots" aria-label={`퀴즈 ${quizIndex + 1}단계`}>
              {quizQuestions.map((_, index) => (
                <span key={index} className={index <= quizIndex ? "active" : ""}>
                  {index < quizIndex ? "✓" : index + 1}
                </span>
              ))}
              <i />
            </div>

            <section className="quiz-card">
              <div className="quiz-character">
                <MascotImage alt="" />
                <span>잘 생각해봐!</span>
              </div>
              <span className="quiz-step">문제 {quizIndex + 1} / 3</span>
              <h1>{quizQuestions[quizIndex].title}</h1>
              <div className="quiz-options">
                {quizQuestions[quizIndex].options.map((option, index) => {
                  const isSelected = quizSelected === index;
                  const isCorrect = index === quizQuestions[quizIndex].answer;
                  return (
                    <button
                      key={option}
                      className={`${isSelected ? "selected" : ""} ${isSelected && isCorrect ? "correct" : ""} ${isSelected && !isCorrect ? "wrong" : ""}`}
                      onClick={() => setQuizSelected(index)}
                    >
                      <span>{index + 1}</span>
                      <strong>{option}</strong>
                      {isSelected && <i>{isCorrect ? "✓" : "×"}</i>}
                    </button>
                  );
                })}
              </div>
              {quizSelected !== null && (
                <aside className={quizSelected === quizQuestions[quizIndex].answer ? "quiz-feedback correct" : "quiz-feedback"}>
                  <strong>
                    {quizSelected === quizQuestions[quizIndex].answer ? "정답이에요!" : "한 번 더 생각해볼까요?"}
                  </strong>
                  <p>{quizQuestions[quizIndex].hint}</p>
                </aside>
              )}
            </section>

            <div className="sticky-action">
              <button
                className="primary-button"
                disabled={quizSelected !== quizQuestions[quizIndex].answer}
                onClick={() => {
                  if (quizIndex < quizQuestions.length - 1) {
                    setQuizIndex((current) => current + 1);
                    setQuizSelected(null);
                  } else {
                    finishQuizReward();
                  }
                }}
              >
                {quizIndex === quizQuestions.length - 1 ? "퀴즈 완료하고 보상 받기" : "다음 문제"}
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {screen === "photoReward" && (
          <div className="screen-content photo-reward-screen">
            <BackHeader title="나의 안전 퍼즐" onBack={() => navigate("mission")} />
            <section className="photo-reward-intro">
              <span className="reward-label">SPECIAL REWARD</span>
              <h1>미션 속 주인공이<br />되어볼까요?</h1>
              <p>안전 자세를 찍은 사진을 넣으면 나만의 퍼즐 한 조각이 완성돼요.</p>
            </section>

            <section className="puzzle-frame-preview">
              <img
                className="puzzle-background"
                src="/assets/reward-earthquake.webp"
                alt="책상 아래 안전 자세를 연습하는 지진 안전 퍼즐 프레임"
              />
              <label className={`photo-puzzle-piece ${userPhoto ? "has-photo composite-done" : ""}`}>
                {userPhoto ? (
                  <>
                    <img src={userPhoto} alt="사용자가 선택한 안전 미션 사진" />
                    <span className="composite-badge">내 사진 합성됨 ✦</span>
                  </>
                ) : (
                  <>
                    <span className="camera-symbol">＋</span>
                    <strong>사진 넣기</strong>
                    <small>안전 자세 사진</small>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handlePhoto(event.target.files?.[0])}
                  aria-label="퍼즐에 넣을 사진 선택"
                />
              </label>
              <span className="puzzle-shine" aria-hidden="true" />
            </section>

            <div className="photo-actions">
              <label className="outline-button photo-upload-button">
                <span>▣</span> {userPhoto ? "다른 사진 선택" : "사진 선택하기"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handlePhoto(event.target.files?.[0])}
                  aria-label="퍼즐에 넣을 사진 선택"
                />
              </label>
              {userPhoto && (
                <button className="remove-photo" onClick={() => setUserPhoto(null)}>
                  사진 지우기
                </button>
              )}
            </div>

            <aside className="privacy-note">
              <span>⌾</span>
              <p><strong>사진은 안전하게</strong><br />이 MVP에서는 선택한 사진이 서버로 전송되지 않고 현재 기기 화면에만 표시돼요.</p>
            </aside>

            <button className="primary-button" onClick={finishMissionReward}>
              퍼즐 완성하고 보상 받기 <span>→</span>
            </button>
            {!userPhoto && (
              <button className="text-button" onClick={finishMissionReward}>사진 없이 기본 퍼즐로 완성하기</button>
            )}
          </div>
        )}

        {screen === "reward" && (
          <div className="screen-content reward-center-screen">
            <BackHeader title="보상 센터 & 포인트 개편" onBack={() => navigate("home")} />

            {rewardNotice && <div className="reward-notice-toast">{rewardNotice}</div>}

            {/* 통합 재화 지갑 바 */}
            <section className="reward-wallet-bar">
              <div className="wallet-chip">
                <span className="chip-icon">🔥</span>
                <div className="wallet-chip-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <label>보유 불씨</label>
                    <button
                      style={{
                        background: "#ff5722",
                        color: "white",
                        border: "none",
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "1px 5px",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setSparks((prev) => prev + 50);
                        triggerFireworks();
                        setRewardNotice("🔥 테스트 보너스 불씨 50개가 즉시 충전되었습니다!");
                        setTimeout(() => setRewardNotice(null), 3000);
                      }}
                    >
                      +50개
                    </button>
                  </div>
                  <strong>{sparks}개</strong>
                </div>
              </div>
              <div className="wallet-divider" />
              <div className="wallet-chip">
                <span className="chip-icon">🎟️</span>
                <div className="wallet-chip-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <label>뽑기 티켓</label>
                    <button
                      style={{
                        background: "#ff9800",
                        color: "white",
                        border: "none",
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "1px 5px",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setGachaTickets((prev) => prev + 50);
                        triggerFireworks();
                        setRewardNotice("🎟️ 보너스 뽑기 티켓 50장이 즉시 지급되었습니다!");
                        setTimeout(() => setRewardNotice(null), 3000);
                      }}
                    >
                      +50장
                    </button>
                  </div>
                  <strong>{gachaTickets}장</strong>
                </div>
              </div>
              <div className="wallet-divider" />
              <div className="wallet-chip">
                <span className="chip-icon">💰</span>
                <div className="wallet-chip-info">
                  <label>보상 포인트</label>
                  <strong>{rewardPoints.toLocaleString()} P</strong>
                </div>
              </div>
            </section>

            {/* 메인 서브 탭 서브 네비게이션 */}
            <nav className="reward-nav-tabs">
              <button
                className={`reward-nav-tab ${rewardSubTab === "gacha" ? "active" : ""}`}
                onClick={() => setRewardSubTab("gacha")}
              >
                🎰 캐릭터 뽑기
              </button>
              <button
                className={`reward-nav-tab ${rewardSubTab === "codex" ? "active" : ""}`}
                onClick={() => setRewardSubTab("codex")}
              >
                📖 캐릭터 도감
              </button>
              <button
                className={`reward-nav-tab ${rewardSubTab === "shop" ? "active" : ""}`}
                onClick={() => setRewardSubTab("shop")}
              >
                🛍️ 불씨 상점
              </button>
              <button
                className={`reward-nav-tab ${rewardSubTab === "points" ? "active" : ""}`}
                onClick={() => setRewardSubTab("points")}
              >
                🎁 포인트 보상
              </button>
            </nav>

            {/* 1. 🎰 캐릭터 뽑기 탭 */}
            {rewardSubTab === "gacha" && (
              <section className="gacha-machine-card">
                <div className="gacha-sparkle-bg" />
                <span className="eyebrow" style={{ color: "#ff7832", fontWeight: 800 }}>
                  SEASON 1 :: 안전 수호 정령 뽑기
                </span>
                <h2 style={{ margin: "4px 0 12px", fontSize: 20, color: "#1b4035" }}>
                  불씨로 티켓을 사서 캐릭터를 뽑아보세요!
                </h2>

                <div className="gacha-stage-visual">
                  <img
                    src="/assets/fire-character-hero.png?v=9"
                    alt="뽑기 머신 마스코트"
                    className={`gacha-machine-img ${isGachaAnimating ? "animating" : ""}`}
                  />
                </div>

                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
                  <span className="rarity-badge rarity-SSR">SSR 5%</span>
                  <span className="rarity-badge rarity-SR">SR 25%</span>
                  <span className="rarity-badge rarity-R">R 35%</span>
                  <span className="rarity-badge rarity-N">N 35%</span>
                </div>

                <p style={{ fontSize: 12, color: "#5d756c", margin: "0 0 16px" }}>
                  💡 이미 수집한 캐릭터가 나오면 <strong>+20 불씨</strong>로 자동 환산됩니다.
                </p>

                <div className="gacha-btn-group">
                  <button
                    className="gacha-draw-btn single"
                    onClick={() => handleDrawGacha(1)}
                    disabled={isGachaAnimating}
                  >
                    <span>🎲 1회 뽑기</span>
                    <small>🎟️ 티켓 1장 소모</small>
                  </button>
                  <button
                    className="gacha-draw-btn ten"
                    onClick={() => handleDrawGacha(10)}
                    disabled={isGachaAnimating}
                  >
                    <span>✨ 10회 연속 뽑기</span>
                    <small>🎟️ 티켓 10장 소모</small>
                  </button>
                </div>
              </section>
            )}

            {/* 2. 📖 캐릭터 도감 탭 */}
            {rewardSubTab === "codex" && (
              <div>
                {/* 전체 수집 달성도 마일스톤 */}
                <section className="reward-tier-card" style={{ marginBottom: 16 }}>
                  <div className="tier-badge-row">
                    <div>
                      <span className="tier-tag">도감 수집률 🏆</span>
                      <h2>
                        {unlockedCharacters.length} / {ALL_CHARACTERS.length} 종 수집 (
                        {Math.round((unlockedCharacters.length / ALL_CHARACTERS.length) * 100)}%)
                      </h2>
                    </div>
                  </div>
                  <div className="progress-track reward-track" style={{ marginTop: 8 }}>
                    <span
                      style={{
                        width: `${Math.round((unlockedCharacters.length / ALL_CHARACTERS.length) * 100)}%`,
                      }}
                    />
                  </div>
                </section>

                {/* 테마 세트 보상 수령 영역 */}
                <section style={{ marginBottom: 18 }}>
                  <h3 style={{ fontSize: 15, color: "#1b4035", margin: "0 0 10px" }}>🎯 도감 완성 포인트 보상</h3>
                  
                  {/* 🔥 불이 세트 보상 */}
                  {(() => {
                    const fireChars = ALL_CHARACTERS.filter((c) => c.category === "fire");
                    const unlockedCount = fireChars.filter((c) => unlockedCharacters.includes(c.name)).length;
                    const isComplete = unlockedCount === fireChars.length;
                    const isClaimed = claimedCodexRewards.includes("fire_set");
                    return (
                      <div className="set-reward-banner">
                        <div>
                          <strong>🔥 불이 정령 세트 수집 ({unlockedCount}/{fireChars.length})</strong>
                          <small>전체 9종 수집 완료 시 5,000 Pts 지급</small>
                        </div>
                        <button
                          className={`reward-claim-btn ${isClaimed ? "claimed" : ""}`}
                          disabled={!isComplete || isClaimed}
                          onClick={() => handleClaimCodexReward("fire_set", 5000, "불이 정령 세트")}
                        >
                          {isClaimed ? "수령 완료 ✔" : isComplete ? "5,000 P 받기 🎁" : "수집 진행 중"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* 💧 물이 세트 보상 */}
                  {(() => {
                    const waterChars = ALL_CHARACTERS.filter((c) => c.category === "water");
                    const unlockedCount = waterChars.filter((c) => unlockedCharacters.includes(c.name)).length;
                    const isComplete = unlockedCount === waterChars.length;
                    const isClaimed = claimedCodexRewards.includes("water_set");
                    return (
                      <div className="set-reward-banner">
                        <div>
                          <strong>💧 물이 정령 세트 수집 ({unlockedCount}/{waterChars.length})</strong>
                          <small>전체 4종 수집 완료 시 2,500 Pts 지급</small>
                        </div>
                        <button
                          className={`reward-claim-btn ${isClaimed ? "claimed" : ""}`}
                          disabled={!isComplete || isClaimed}
                          onClick={() => handleClaimCodexReward("water_set", 2500, "물이 정령 세트")}
                        >
                          {isClaimed ? "수령 완료 ✔" : isComplete ? "2,500 P 받기 🎁" : "수집 진행 중"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* 🌬️ 바람이 세트 보상 */}
                  {(() => {
                    const windChars = ALL_CHARACTERS.filter((c) => c.category === "wind");
                    const unlockedCount = windChars.filter((c) => unlockedCharacters.includes(c.name)).length;
                    const isComplete = unlockedCount === windChars.length;
                    const isClaimed = claimedCodexRewards.includes("wind_set");
                    return (
                      <div className="set-reward-banner">
                        <div>
                          <strong>🌬️ 바람이 정령 세트 수집 ({unlockedCount}/{windChars.length})</strong>
                          <small>전체 4종 수집 완료 시 2,500 Pts 지급</small>
                        </div>
                        <button
                          className={`reward-claim-btn ${isClaimed ? "claimed" : ""}`}
                          disabled={!isComplete || isClaimed}
                          onClick={() => handleClaimCodexReward("wind_set", 2500, "바람이 정령 세트")}
                        >
                          {isClaimed ? "수령 완료 ✔" : isComplete ? "2,500 P 받기 🎁" : "수집 진행 중"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* 🪵 땅이 세트 보상 */}
                  {(() => {
                    const earthChars = ALL_CHARACTERS.filter((c) => c.category === "earth");
                    const unlockedCount = earthChars.filter((c) => unlockedCharacters.includes(c.name)).length;
                    const isComplete = unlockedCount === earthChars.length;
                    const isClaimed = claimedCodexRewards.includes("earth_set");
                    return (
                      <div className="set-reward-banner">
                        <div>
                          <strong>🪵 땅이 정령 세트 수집 ({unlockedCount}/{earthChars.length})</strong>
                          <small>전체 5종 수집 완료 시 3,000 Pts 지급</small>
                        </div>
                        <button
                          className={`reward-claim-btn ${isClaimed ? "claimed" : ""}`}
                          disabled={!isComplete || isClaimed}
                          onClick={() => handleClaimCodexReward("earth_set", 3000, "땅이 정령 세트")}
                        >
                          {isClaimed ? "수령 완료 ✔" : isComplete ? "3,000 P 받기 🎁" : "수집 진행 중"}
                        </button>
                      </div>
                    );
                  })()}
                </section>

                {/* 캐릭터 카탈로그 그리드 */}
                <div className="codex-section-title">
                  <h3>전체 캐릭터 도감 ({unlockedCharacters.length}/{ALL_CHARACTERS.length})</h3>
                  <button className="text-button" onClick={() => setShowCodexModal(true)}>
                    🔍 크게 보기
                  </button>
                </div>

                <div className="codex-grid-v2">
                  {ALL_CHARACTERS.map((char) => {
                    const isUnlocked = unlockedCharacters.includes(char.name);
                    return (
                      <div
                        key={char.name}
                        className={`codex-item-card ${isUnlocked ? "unlocked" : "locked"}`}
                        onClick={() => {
                          setSelectedCodexName(char.name);
                          setShowCodexModal(true);
                        }}
                      >
                        <span className={`rarity-badge rarity-${char.rarity}`} style={{ position: "absolute", top: 6, left: 6 }}>
                          {char.rarity}
                        </span>
                        <img src={char.src} alt={char.name} style={{ width: 50, height: 50, objectFit: "contain", marginTop: 12 }} />
                        <strong>{isUnlocked ? char.name : "미획득"}</strong>
                        <small>{isUnlocked ? char.level : "🔒 뽑기 전용"}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. 🛍️ 불씨 상점 탭 */}
            {rewardSubTab === "shop" && (
              <section>
                <div style={{ background: "white", padding: 18, borderRadius: 24, border: "1.5px solid #e1ebe6", marginBottom: 16 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#1b4035", fontWeight: 900 }}>
                    🔥 불씨 → 🎟️ 뽑기 티켓 교환소
                  </h3>
                  <p style={{ margin: "0 0 14px", fontSize: 12, color: "#5d756c" }}>
                    미션과 퀴즈를 풀고 모은 불씨로 캐릭터 뽑기 티켓을 교환하세요.
                  </p>

                  <div className="ticket-shop-grid">
                    {/* 1장 단품 교환 */}
                    <article className="ticket-shop-card">
                      <div className="ticket-card-header">
                        <div className="ticket-badge-wrap">
                          <span className="ticket-icon">🎟️</span>
                          <div>
                            <strong className="ticket-card-title">뽑기 티켓 1장</strong>
                            <p className="ticket-card-sub">캐릭터 1회 뽑기에 사용됩니다</p>
                          </div>
                        </div>
                        <div className="ticket-price-box">
                          <span className="ticket-cost-label">필요 불씨</span>
                          <strong className="ticket-cost-val">🔥 100개</strong>
                        </div>
                      </div>
                      <button
                        className="ticket-buy-btn"
                        onClick={() => handleBuyTickets(1)}
                      >
                        🎟️ 1장 교환하기
                      </button>
                    </article>

                    {/* 10장 묶음 교환 (할인 특가) */}
                    <article className="ticket-shop-card bundle-featured">
                      <span className="discount-ribbon">🔥 10% 할인</span>
                      <div className="ticket-card-header">
                        <div className="ticket-badge-wrap">
                          <span className="ticket-icon bundle">🎟️x10</span>
                          <div>
                            <strong className="ticket-card-title">뽑기 티켓 10장 묶음</strong>
                            <p className="ticket-card-sub">불씨 100개 절약! 연속 10회 뽑기 가능</p>
                          </div>
                        </div>
                        <div className="ticket-price-box">
                          <span className="ticket-cost-label">할인 적용가</span>
                          <strong className="ticket-cost-val bundle-val">🔥 900개</strong>
                          <small className="ticket-original-price">1,000개</small>
                        </div>
                      </div>
                      <button
                        className="ticket-buy-btn bundle-btn"
                        onClick={() => handleBuyTickets(10)}
                      >
                        ⚡ 10장 한꺼번에 교환하기 (🔥 100개 절약)
                      </button>
                    </article>
                  </div>
                </div>

                <div style={{ background: "#f0f7f3", padding: 16, borderRadius: 20, textAlign: "center" }}>
                  <strong style={{ display: "block", fontSize: 14, color: "#1b4035", marginBottom: 4 }}>
                    불씨가 부족하신가요?
                  </strong>
                  <p style={{ fontSize: 12, color: "#5d756c", margin: "0 0 12px" }}>
                    일일 미션 수행과 재난 안전 퀴즈를 풀면 매일 불씨를 수급할 수 있습니다!
                  </p>
                  <button
                    className="secondary-button"
                    style={{ width: "100%", padding: 10 }}
                    onClick={() => navigate("mission")}
                  >
                    🎯 미션 & 퀴즈 풀러 가기
                  </button>
                </div>
              </section>
            )}

            {/* 4. 🎁 포인트 보상 탭 */}
            {rewardSubTab === "points" && (
              <section>
                <div style={{ background: "white", padding: 18, borderRadius: 24, border: "1.5px solid #e1ebe6", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: 16, color: "#1b4035", fontWeight: 900 }}>
                        💰 포인트 연동 실물 교환소
                      </h3>
                      <p style={{ margin: 0, fontSize: 12, color: "#5d756c" }}>
                        도감 수집으로 모은 포인트로 맞춤형 실물 키트를 신청하세요!
                      </p>
                    </div>
                    <div style={{ background: "#fff5ec", padding: "6px 12px", borderRadius: 14, border: "1px solid #ffcc80", textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "#e65100", display: "block", fontWeight: 700 }}>내 보상 포인트</span>
                      <strong style={{ fontSize: 15, color: "#ff7043", fontWeight: 900 }}>{rewardPoints.toLocaleString()} P</strong>
                    </div>
                  </div>

                  <div className="point-exchange-grid">
                    <article className="point-item-card">
                      <div className="point-item-header">
                        <span className="point-item-icon">🎒</span>
                        <div className="point-item-info">
                          <div className="point-title-row">
                            <strong>{userName}의 맞춤형 안전 백팩 키트</strong>
                            <span className="point-cost-badge">20,000 Pts</span>
                          </div>
                          <p>{userName} 캐릭터 패치와 진화 정보가 그대로 반영된 비상 가방</p>
                        </div>
                      </div>
                      <button
                        className="point-claim-btn"
                        onClick={() => {
                          triggerFireworks();
                          setShowKitModal(true);
                        }}
                      >
                        🚚 키트 배송 신청하기
                      </button>
                    </article>

                    <article className="point-item-card">
                      <div className="point-item-header">
                        <span className="point-item-icon">⛑️</span>
                        <div className="point-item-info">
                          <div className="point-title-row">
                            <strong>어린이 안전 방재모 & 플래시</strong>
                            <span className="point-cost-badge">10,000 Pts</span>
                          </div>
                          <p>충격 흡수 야간 반사 모자 및 고성능 LED 랜턴 세트</p>
                        </div>
                      </div>
                      <button
                        className="point-claim-btn"
                        onClick={() => {
                          triggerFireworks();
                          setShowKitModal(true);
                        }}
                      >
                        🚚 키트 배송 신청하기
                      </button>
                    </article>

                    <article className="point-item-card">
                      <div className="point-item-header">
                        <span className="point-item-icon">📖</span>
                        <div className="point-item-info">
                          <div className="point-title-row">
                            <strong>{userName} 주인공 3D 안전 팝업북</strong>
                            <span className="point-cost-badge">50,000 Pts</span>
                          </div>
                          <p>{userName}(이)가 직접 주인공으로 등장하는 입체 재난 대응 만화책</p>
                        </div>
                      </div>
                      <button
                        className="point-claim-btn"
                        onClick={() => {
                          triggerFireworks();
                          setShowKitModal(true);
                        }}
                      >
                        🚚 키트 배송 신청하기
                      </button>
                    </article>
                  </div>
                </div>
              </section>
            )}

            {/* 뽑기 결과 팝업 모달 */}
            {gachaResult && (
              <div className="gacha-result-overlay" onClick={() => setGachaResult(null)}>
                <div className="gacha-result-card" onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, color: "#1b4035" }}>
                    🎉 {gachaResult.isTen ? "10회 연속" : "1회"} 뽑기 결과!
                  </h2>
                  <p style={{ fontSize: 13, color: "#555", margin: "0 0 14px" }}>
                    수집한 캐릭터는 도감에서 확인하고 포인트를 획득할 수 있습니다.
                  </p>

                  <div className="gacha-card-grid">
                    {gachaResult.characters.map((char, index) => (
                      <div key={index} className="gacha-card-item">
                        {char.isNew && <span className="new-tag">NEW!</span>}
                        <span className={`rarity-badge rarity-${char.rarity}`}>{char.rarity}</span>
                        <img src={char.src} alt={char.name} />
                        <strong style={{ fontSize: 11, color: "#1b4035" }}>{char.name}</strong>
                        {!char.isNew && (
                          <small style={{ fontSize: 9, color: "#ff5722", fontWeight: 800 }}>+20 불씨 환산</small>
                        )}
                      </div>
                    ))}
                  </div>

                  <button className="primary-button" style={{ width: "100%" }} onClick={() => setGachaResult(null)}>
                    확인
                  </button>
                </div>
              </div>
            )}

            <button className="outline-button wide" onClick={() => navigate("home")} style={{ marginTop: 16 }}>
              홈으로 돌아가기
            </button>
          </div>
        )}

        {screen === "world" && (
          <div className="screen-content world-screen">
            <header className="world-header">
              <div>
                <span className="eyebrow">성동구 안전 월드</span>
                <h1>우리 동네를 밝혀요</h1>
              </div>
              <span className="spark-counter">✦ {sparks}</span>
            </header>

            <section className="world-map">
              <div className="river"><span>한강</span></div>
              <span className="map-path path-a" />
              <span className="map-path path-b" />
              <span className="map-path path-c" />
              <div className="world-place place-home unlocked">
                <span className="place-light" />
                <span className="place-icon">⌂</span>
                <strong>우리 집</strong>
                <small>{missionDone ? "불이 켜졌어요!" : "미션 1개 남음"}</small>
              </div>
              <div className="world-place place-school">
                <span className="place-icon">▤</span>
                <strong>학교 가는 길</strong>
                <small>다음 지역</small>
              </div>
              <div className="world-place place-park locked">
                <span className="lock-mark">⌾</span>
                <span className="place-icon">♧</span>
                <strong>서울숲</strong>
                <small>미션 3개 필요</small>
              </div>
              <div className="world-place place-station locked">
                <span className="lock-mark">⌾</span>
                <span className="place-icon">M</span>
                <strong>성수역</strong>
                <small>미션 5개 필요</small>
              </div>
              <div className="map-cloud cloud-a">☁</div>
              <div className="map-cloud cloud-b">☁</div>
            </section>

            <section className="next-zone-card">
              <div className="zone-thumbnail">▤</div>
              <div>
                <span className="eyebrow">다음 탐험</span>
                <strong>학교 가는 길 안전 찾기</strong>
                <p>횡단보도와 안전한 기다림 장소를 찾아봐요.</p>
              </div>
              <button onClick={() => navigate("mission")}>›</button>
            </section>

            <aside className="map-disclaimer">
              이 지도는 안전 습관을 위한 게임형 지도예요. 실제 대피 경로는 공식 지도를 확인해주세요.
            </aside>
          </div>
        )}

        {screen === "safety" && (
          <div className="screen-content safety-world-screen">
            <header className="safety-world-header-card">
              <div>
                <span className="eyebrow">성동구 안전 월드</span>
                <h1>우리 동네를 밝혀요</h1>
              </div>
              <div className="star-points-badge">
                <span className="star-icon">✦</span>
                <strong>50</strong>
              </div>
            </header>

            <section className="safety-world-map">
              <img className="map-bg-image" src="/assets/safety-world-exact-bg.png" alt="성동구 안전 월드 지도" />

              <div className="map-node node-home" style={{ top: "27%", left: "30%" }}>
                <div className="node-label-pill">우리 집</div>
                <span className="node-sub">{missionDone ? "불이 켜졌어요!" : "미션 1개 남음"}</span>
              </div>

              <div className="map-node node-school" style={{ top: "42%", left: "71%" }}>
                <div className="node-label-pill">학교 가는 길</div>
                <span className="node-sub highlight">다음 지역</span>
              </div>

              <div className="map-node node-forest" style={{ top: "64%", left: "28%" }}>
                <div className="node-label-pill">서울숲</div>
                <span className="node-sub">미션 3개 필요</span>
              </div>

              <div className="map-node node-station" style={{ top: "77%", left: "73%" }}>
                <div className="node-label-pill">성수역</div>
                <span className="node-sub">미션 5개 필요</span>
              </div>

              <span className="river-label">한강</span>
            </section>

            <section className="next-adventure-card">
              <div className="adventure-icon-box">
                <span>📑</span>
              </div>
              <div className="adventure-info">
                <span className="eyebrow">다음 탐험</span>
                <strong>학교 가는 길 안전 찾기</strong>
                <p>횡단보도와 안전한 기다림 장소를 찾아봐요.</p>
              </div>
              <button className="adventure-go-btn" onClick={() => navigate("mission")} aria-label="탐험 시작">
                ›
              </button>
            </section>

            <aside className="map-disclaimer">
              이 지도는 안전 습관을 위한 게임형 지도예요. 실제 대피 경로는 공식 지도를 확인해주세요.
            </aside>
          </div>
        )}

        {screen === "family" && (
          <div className="screen-content family-screen">
            <header className="family-header">
              <div>
                <span className="eyebrow">우리 가족</span>
                <h1>위치와 안전 상태</h1>
              </div>
              <button className="icon-button" aria-label="가족 알림">♢</button>
            </header>

            <section className="family-map-card">
              <span className="family-road road-a" />
              <span className="family-road road-b" />
              <div className="family-person child-location">
                <span className="role-avatar child-avatar">{userName[0] || "도"}</span>
                <strong>{userName}</strong>
                <small>돌봄교실</small>
              </div>
              <div className="family-person guardian-location">
                <span className="role-avatar guardian-avatar">민</span>
                <strong>엄마</strong>
                <small>성수동 회사</small>
              </div>
              <span className="family-map-label">성수초등학교</span>
            </section>

            <section className={`family-status-card ${checkinSent ? "is-safe" : ""}`}>
              <div className="family-avatar-pair">
                <span className="role-avatar child-avatar">{userName[0] || "도"}</span>
                <span className="status-online" />
              </div>
              <div>
                <small>{userName} · 방과후 돌봄교실</small>
                <strong>{checkinSent ? "“엄마, 저는 안전해요!”" : "아직 안부를 확인하지 않았어요"}</strong>
                <span>{checkinSent ? "방금 전 상태 확인 · 배터리 82%" : "마지막 확인 18분 전"}</span>
              </div>
              <span className="safe-state">{checkinSent ? "안전" : "확인 필요"}</span>
            </section>

            <div className="family-action-grid">
              <button>
                <span>☎</span>
                <strong>전화하기</strong>
                <small>{userName}에게 전화 연결</small>
              </button>
              <button onClick={openCheckin}>
                <span>♥</span>
                <strong>안부 묻기</strong>
                <small>1‑Click 확인 요청</small>
              </button>
            </div>

            <section className="family-notifications">
              <div className="section-heading">
                <h2>최근 알림</h2>
                <button>전체보기</button>
              </div>
              <article>
                <span className="notification-kind emergency">!</span>
                <div><strong>성동구 호우경보 안내</strong><small>아이 위치에 맞는 행동 가이드가 도착했어요.</small></div>
                <time>16:02</time>
              </article>
              <article>
                <span className="notification-kind mission">★</span>
                <div><strong>오늘의 미션 완료</strong><small>책상 아래 안전 자세를 연습했어요.</small></div>
                <time>어제</time>
              </article>
            </section>
          </div>
        )}

        {screen === "guardian" && (
          <div className="screen-content guardian-screen">
            <header className="guardian-header">
              <div>
                <span className="eyebrow">더보기</span>
                <h1>{userName}의 성장 기록</h1>
              </div>
              <button className="icon-button" aria-label="프로필 설정" onClick={() => setShowAvatarModal(true)}>⚙</button>
            </header>

            <section className="profile-card">
              <div className="profile-avatar">
                {profileAvatarSrc ? (
                  <img src={profileAvatarSrc} alt={userName} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  userName[0] || "도"
                )}
              </div>
              <div>
                <strong>{userName} · 초등학교 2학년</strong>
                <span>서울 성동구 · 아파트</span>
              </div>
              <button onClick={() => setShowAvatarModal(true)}>프로필 수정</button>
            </section>

            <section className="character-collection">
              <div className="section-heading">
                <div><span className="eyebrow">성장 캐릭터</span><h2>우리의 안전 친구들</h2></div>
                <button onClick={() => setShowCodexModal(true)}>도감 보기</button>
              </div>
              <div className="character-row">
                <article
                  className="character-item unlocked"
                  onClick={() => {
                    setCodexCategory("fire");
                    setSelectedCodexName(fireForm.name);
                    setShowCodexModal(true);
                  }}
                >
                  <div className="character-orb fire">
                    <img src={fireForm.src} alt={fireForm.name} style={{ width: 44, height: 44, objectFit: "contain" }} />
                  </div>
                  <strong>{fireForm.name}</strong><small>{fireForm.level}</small>
                </article>
                <article
                  className="character-item unlocked"
                  onClick={() => {
                    setCodexCategory("water");
                    setSelectedCodexName(waterForm.name);
                    setShowCodexModal(true);
                  }}
                >
                  <span className="character-badge-heart">❤️</span>
                  <div className="character-orb water">
                    <img src={waterForm.src} alt={waterForm.name} style={{ width: 44, height: 44, objectFit: "contain" }} />
                  </div>
                  <strong>{waterForm.name}</strong><small>{waterForm.level}</small>
                </article>
                <article
                  className="character-item unlocked"
                  onClick={() => {
                    setCodexCategory("wind");
                    setSelectedCodexName(windForm.name);
                    setShowCodexModal(true);
                  }}
                >
                  <div className="character-orb wind">
                    <img src={windForm.src} alt={windForm.name} style={{ width: 44, height: 44, objectFit: "contain" }} />
                  </div>
                  <strong>{windForm.name}</strong><small>{windForm.level}</small>
                </article>
                <article
                  className="character-item unlocked"
                  onClick={() => {
                    setCodexCategory("earth");
                    setSelectedCodexName(earthForm.name);
                    setShowCodexModal(true);
                  }}
                >
                  <div className="character-orb earth">
                    <img src={earthForm.src} alt={earthForm.name} style={{ width: 44, height: 44, objectFit: "contain" }} />
                  </div>
                  <strong>{earthForm.name}</strong><small>{earthForm.level}</small>
                </article>
              </div>
            </section>

            <section className="reward-gallery">
              <div className="section-heading">
                <div><span className="eyebrow">퍼즐 리워드</span><h2>내가 주인공인 안전 앨범</h2></div>
                <span>{missionDone ? "1" : "0"} / 5</span>
              </div>
              <div className="reward-gallery-row">
                <article className={missionDone ? "earned" : ""}>
                  <img src="/assets/reward-earthquake.webp" alt="지진에서 살아남기 퍼즐" />
                  <span>{missionDone ? "완성" : "진행 중"}</span>
                </article>
                <article className="locked">
                  <img src="/assets/reward-heatwave.webp" alt="폭염에서 살아남기 퍼즐" />
                  <span>잠김</span>
                </article>
                <article className="locked">
                  <img src="/assets/reward-fire.webp" alt="화재에서 살아남기 퍼즐" />
                  <span>잠김</span>
                </article>
                <article className="locked">
                  <img src="/assets/reward-tsunami.webp" alt="태풍과 해일에서 살아남기 퍼즐" />
                  <span>잠김</span>
                </article>
              </div>
            </section>

            <section className="weekly-report">
              <div className="report-title">
                <div>
                  <span className="eyebrow">이번 주</span>
                  <h2>안전 행동 2개를 익혔어요</h2>
                </div>
                <span className="report-badge">좋은 출발!</span>
              </div>
              <div className="report-stats">
                <div><strong>2</strong><span>완료 미션</span></div>
                <div><strong>80</strong><span>모은 불씨</span></div>
                <div><strong>3일</strong><span>연속 참여</span></div>
              </div>
            </section>

            <section className="skill-report">
              <div className="section-heading">
                <h2>재난 유형별 진행</h2>
                <button>전체보기</button>
              </div>
              {[
                { label: "지진", icon: "⌁", value: 66, color: "coral", note: "2 / 3" },
                { label: "화재", icon: "♨", value: 33, color: "yellow", note: "1 / 3" },
                { label: "호우", icon: "☂", value: 15, color: "blue", note: "1 / 5" },
              ].map((item) => (
                <div className="skill-row" key={item.label}>
                  <span className={`skill-icon ${item.color}`}>{item.icon}</span>
                  <div>
                    <span><strong>{item.label}</strong><small>{item.note}</small></span>
                    <div className={`progress-track ${item.color}`}>
                      <i style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="recommend-card">
              <span className="recommend-icon">☎</span>
              <div>
                <small>다음 추천 미션</small>
                <strong>가족 비상 연락처 확인하기</strong>
                <p>약 5분 · 불씨 30개</p>
              </div>
              <button onClick={() => navigate("mission")}>›</button>
            </section>

            <p className="report-disclaimer">
              이 기록은 가족의 안전교육 진행 상황을 보여주는 참고 자료이며 실제 재난 대응 능력을 평가하지 않아요.
            </p>
            <button
              className="outline-button wide onboarding-replay"
              onClick={async () => {
                await supabase.auth.signOut();
                setEmail("");
                setPassword("");
                setAuthSuccess("");
                setAuthError("");
                navigate("login");
              }}
            >
              로그아웃
            </button>
          </div>
        )}

        {!["onboarding", "login", "alert", "situation", "actions", "checkin", "mission", "quiz", "photoReward", "reward"].includes(screen) && (
          <BottomNav current={screen} onNavigate={navigate} />
        )}

        {showCodexModal && (
          <div className="codex-modal-overlay" onClick={() => setShowCodexModal(false)}>
            <div className="codex-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="codex-header">
                <h2>📖 안전 캐릭터 도감</h2>
                <button
                  style={{ border: 0, background: "transparent", fontSize: 18, cursor: "pointer" }}
                  onClick={() => setShowCodexModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="codex-stats-banner">
                <div className="codex-stats-top">
                  <span>안전 파트너 수집 현황</span>
                  <strong style={{ color: "#ffd361" }}>
                    {unlockedCharacters.length} / {ALL_CHARACTERS.length} 종 수집 ({Math.round((unlockedCharacters.length / ALL_CHARACTERS.length) * 100)}%) 🎉
                  </strong>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.85)" }}>
                  원하는 캐릭터를 선택하여 해당 원소 수호신의 장착 진화형을 변경하실 수 있습니다.
                </div>
              </div>

              <div className="codex-tabs">
                {[
                  { id: "all", label: `전체 (${unlockedCharacters.length}/${ALL_CHARACTERS.length})` },
                  {
                    id: "fire",
                    label: `🔥 불이 (${ALL_CHARACTERS.filter((c) => c.category === "fire" && unlockedCharacters.includes(c.name)).length}/${ALL_CHARACTERS.filter((c) => c.category === "fire").length})`,
                  },
                  {
                    id: "water",
                    label: `💧 물이 (${ALL_CHARACTERS.filter((c) => c.category === "water" && unlockedCharacters.includes(c.name)).length}/${ALL_CHARACTERS.filter((c) => c.category === "water").length})`,
                  },
                  {
                    id: "wind",
                    label: `🌬️ 바람이 (${ALL_CHARACTERS.filter((c) => c.category === "wind" && unlockedCharacters.includes(c.name)).length}/${ALL_CHARACTERS.filter((c) => c.category === "wind").length})`,
                  },
                  {
                    id: "earth",
                    label: `🪵 땅이 (${ALL_CHARACTERS.filter((c) => c.category === "earth" && unlockedCharacters.includes(c.name)).length}/${ALL_CHARACTERS.filter((c) => c.category === "earth").length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`codex-tab-btn ${codexCategory === tab.id ? "active" : ""}`}
                    onClick={() => setCodexCategory(tab.id as any)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="codex-grid">
                {ALL_CHARACTERS.filter((char) => {
                  if (codexCategory === "fire") return char.category === "fire";
                  if (codexCategory === "water") return char.category === "water";
                  if (codexCategory === "wind") return char.category === "wind";
                  if (codexCategory === "earth") return char.category === "earth";
                  return true;
                }).map((char) => {
                  const isUnlocked = unlockedCharacters.includes(char.name);
                  const isSelected = selectedCodexName === char.name;
                  return (
                    <div
                      key={char.name}
                      className={`codex-card ${isSelected ? "selected" : ""} ${isUnlocked ? "unlocked" : "locked"}`}
                      onClick={() => setSelectedCodexName(char.name)}
                      style={{ position: "relative" }}
                    >
                      {!isUnlocked && (
                        <span
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            fontSize: 9,
                            background: "rgba(90, 105, 98, 0.75)",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: 8,
                            fontWeight: 800,
                            zIndex: 2,
                          }}
                        >
                          🔒 미획득
                        </span>
                      )}
                      <div className="codex-char-img-wrap">
                        <img
                          src={char.src}
                          alt={char.name}
                          style={{
                            filter: isUnlocked ? "none" : "grayscale(100%) contrast(80%) opacity(0.35)",
                          }}
                        />
                      </div>
                      <strong>{isUnlocked ? char.name : char.name}</strong>
                      <small style={{ color: isUnlocked ? "#889993" : "#92a49d" }}>
                        {isUnlocked ? `${char.level} · ${char.attr}` : "🔒 뽑기 전용"}
                      </small>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const activeChar = ALL_CHARACTERS.find((c) => c.name === selectedCodexName) || ALL_CHARACTERS[0];
                const isUnlocked = unlockedCharacters.includes(activeChar.name);

                return (
                  <div className="codex-detail-box">
                    <div className="codex-detail-title">
                      <div>
                        <strong style={{ fontSize: 16, color: "#1b4035", display: "block" }}>
                          {activeChar.name} ({activeChar.level})
                        </strong>
                        <span style={{ fontSize: 12, color: isUnlocked ? "#ff8b4d" : "#999", fontWeight: 700 }}>
                          {activeChar.attr} {isUnlocked ? "✔ 보유 중" : "🔒 미획득 (장착 불가)"}
                        </span>
                      </div>
                      <img
                        src={activeChar.src}
                        alt={activeChar.name}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: "contain",
                          filter: isUnlocked ? "none" : "brightness(0.2) opacity(0.5)",
                        }}
                      />
                    </div>
                    <p style={{ margin: "10px 0", fontSize: 13, color: "#2c3e35", lineHeight: 1.5, background: "#fff", padding: "10px 12px", borderRadius: 14, border: "1px solid #e1ebe6" }}>
                      📖 <strong>캐릭터 설명:</strong> {activeChar.desc}
                    </p>
                    <div style={{ background: "#f0f7f3", padding: "10px 12px", borderRadius: 14, fontSize: 12, color: "#1b4035" }}>
                      ⚡ <strong>보유 안전 기술:</strong> {activeChar.skill}
                    </div>

                    {isUnlocked ? (
                      <button
                        className="primary-button"
                        style={{ width: "100%", marginTop: 12, padding: 10, fontSize: 13 }}
                        onClick={() => {
                          setProfileAvatarSrc(activeChar.src);
                          if (activeChar.category === "fire") {
                            setFireForm({ name: activeChar.name, src: activeChar.src, level: activeChar.level });
                          } else if (activeChar.category === "water") {
                            setWaterForm({ name: activeChar.name, src: activeChar.src, level: activeChar.level });
                          } else if (activeChar.category === "wind") {
                            setWindForm({ name: activeChar.name, src: activeChar.src, level: activeChar.level });
                          } else if (activeChar.category === "earth") {
                            setEarthForm({ name: activeChar.name, src: activeChar.src, level: activeChar.level });
                          }
                          setShowCodexModal(false);
                        }}
                      >
                        ★ {activeChar.name}(으)로 선택 및 진화 폼 장착하기
                      </button>
                    ) : (
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        <button
                          className="outline-button"
                          disabled={true}
                          style={{
                            width: "100%",
                            padding: 10,
                            fontSize: 13,
                            background: "#f5f5f5",
                            color: "#999",
                            borderColor: "#ddd",
                            cursor: "not-allowed",
                            fontWeight: 700,
                          }}
                        >
                          🔒 선택 불가 (뽑기 미획득 캐릭터)
                        </button>
                        <button
                          className="primary-button"
                          style={{
                            width: "100%",
                            padding: 10,
                            fontSize: 13,
                            background: "linear-gradient(135deg, #ff9800, #f57c00)",
                          }}
                          onClick={() => {
                            setShowCodexModal(false);
                            setRewardSubTab("gacha");
                            navigate("reward");
                          }}
                        >
                          🎲 불씨 상점에서 뽑기 티켓으로 획득하기 →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              <button className="text-button" style={{ width: "100%" }} onClick={() => setShowCodexModal(false)}>
                닫기
              </button>
            </div>
          </div>
        )}

        {showKitModal && (
          <div className="kit-celebration-modal" onClick={() => setShowKitModal(false)}>
            <div className="kit-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="kit-celebration-banner">🎉 📦 🚚</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#1b4035" }}>
                배송 신청 완료!
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#555" }}>
                <strong>{userName} 어린이</strong>를 위한 맞춤형 안전 키트 배송이 시작되었어요! 🎁
              </p>

              <div className="kit-items-preview">
                <div className="kit-item-row">
                  <span>🎒</span>
                  <div>
                    <div>{userName}의 맞춤형 안전 백팩</div>
                    <small style={{ color: "#777" }}>{userName} 캐릭터 패치 및 방재 도구 내장</small>
                  </div>
                </div>
                <div className="kit-item-row">
                  <span>⛑️</span>
                  <div>
                    <div>어린이 안전 방재 모자</div>
                    <small style={{ color: "#777" }}>충격 흡수 및 야간 반사 소재</small>
                  </div>
                </div>
                <div className="kit-item-row">
                  <span>📖</span>
                  <div>
                    <div>{userName} 주인공 3D 안전 팝업북</div>
                    <small style={{ color: "#777" }}>{userName} 어린이가 직접 등장하는 재난 대응 만화</small>
                  </div>
                </div>
              </div>

              <div style={{ background: "#f0f6f4", borderRadius: 14, padding: "10px 12px", marginBottom: 16, fontSize: 12, textAlign: "left" }}>
                <div>📍 <strong>배송지</strong>: 서울특별시 성동구 성수동</div>
                <div>⏱️ <strong>예상 도착</strong>: 영업일 기준 2일 이내</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  className="secondary-button"
                  style={{ width: "100%", background: "#fff5d6", borderColor: "#f9d271", color: "#8d6600", fontWeight: 800 }}
                  onClick={triggerFireworks}
                >
                  ✨ 빵빠레 폭죽 한 번 더 터뜨리기! 🎉
                </button>
                <button className="primary-button" style={{ width: "100%" }} onClick={() => setShowKitModal(false)}>
                  확인 (닫기)
                </button>
              </div>
            </div>
          </div>
        )}

        {showAvatarModal && (
          <div className="avatar-selector-modal" onClick={() => setShowAvatarModal(false)}>
            <div className="avatar-modal-card" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
              {/* 우측 상위 컴팩트 미니멀 저장 버튼 */}
              <button
                type="button"
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  width: "auto",
                  display: "inline-block",
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#ffffff",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #1b4035, #2d5b4c)",
                  boxShadow: "0 2px 6px rgba(27, 64, 53, 0.2)",
                  border: "none",
                  cursor: "pointer",
                  zIndex: 10,
                }}
                onClick={() => {
                  setRewardNotice(`✨ ${userName} 어린이의 프로필이 성공적으로 저장되었습니다!`);
                  setTimeout(() => setRewardNotice(null), 3000);
                  setShowAvatarModal(false);
                }}
              >
                저장
              </button>

              {/* 상단 툴바 */}
              <div style={{ marginBottom: 12, paddingRight: 60 }}>
                <h3 style={{ margin: "0 0 2px", fontSize: 18, color: "#1b4035", fontWeight: 900 }}>
                  프로필 설정
                </h3>
                <span style={{ fontSize: 12, color: "#667c73" }}>이름과 캐릭터 아바타를 수정하세요</span>
              </div>

              {/* 어린이 이름 입력란 */}
              <div style={{ margin: "16px 0 14px", background: "#f6faf8", padding: "12px 14px", borderRadius: 18, border: "1.5px solid #e1ebe6" }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#1b4035", display: "block", marginBottom: 6 }}>
                  ✏️ 어린이 이름
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="이름을 입력하세요 (예: 도도, 서준)"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1.5px solid #b8d5c8",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#1b4035",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "white",
                  }}
                />
              </div>

              {/* 사진 업로드 버튼 */}
              <label
                className="outline-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  textAlign: "center",
                  marginBottom: 14,
                  cursor: "pointer",
                  padding: "10px 14px",
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 800,
                  borderColor: "#cce0d8",
                  color: "#1b4035",
                  background: "#f0f7f3",
                }}
              >
                📷 직접 찍은 사진 / 파일 업로드
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProfileAvatarSrc(String(reader.result));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {userPhoto && (
                <button
                  className="secondary-button"
                  style={{ width: "100%", marginBottom: 14, borderRadius: 14 }}
                  onClick={() => setProfileAvatarSrc(userPhoto)}
                >
                  📸 미션 중 촬영한 사진 적용하기
                </button>
              )}

              <strong style={{ fontSize: 13, color: "#1b4035", fontWeight: 800, display: "block", marginBottom: 8 }}>
                안전 캐릭터 선택
              </strong>

              <div className="avatar-character-grid">
                {ALL_CHARACTERS.map((char) => {
                  const isUnlocked = unlockedCharacters.includes(char.name);
                  const isSelected = profileAvatarSrc === char.src;
                  return (
                    <button
                      key={char.name}
                      className={`avatar-char-btn ${isSelected ? "selected" : ""} ${isUnlocked ? "" : "locked"}`}
                      disabled={!isUnlocked}
                      onClick={() => {
                        if (!isUnlocked) return;
                        setProfileAvatarSrc(char.src);
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            fontSize: 10,
                            background: "#1b4035",
                            color: "white",
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900,
                          }}
                        >
                          ✓
                        </span>
                      )}
                      {!isUnlocked && (
                        <span style={{ position: "absolute", top: 4, right: 4, fontSize: 10 }}>🔒</span>
                      )}
                      <img src={char.src} alt={char.name} />
                      <span>{isUnlocked ? char.name : "미획득"}</span>
                    </button>
                  );
                })}
              </div>

              <button className="text-button" style={{ width: "100%", padding: 10 }} onClick={() => setShowAvatarModal(false)}>
                닫기
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
