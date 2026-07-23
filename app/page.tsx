"use client";

import { useMemo, useState } from "react";

type Screen =
  | "onboarding"
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

const navItems: Array<{ screen: Screen; icon: string; label: string }> = [
  { screen: "home", icon: "⌂", label: "홈" },
  { screen: "mission", icon: "★", label: "미션" },
  { screen: "safety", icon: "⌖", label: "안심지도" },
  { screen: "family", icon: "♧", label: "가족" },
  { screen: "guardian", icon: "•••", label: "더보기" },
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
      <div className="flame-glow" />
      <div className="flame-body">
        <span className="flame-eye left" />
        <span className="flame-eye right" />
        <span className="flame-mouth" />
        <span className="flame-cheek left" />
        <span className="flame-cheek right" />
      </div>
      <span className="flame-arm left" />
      <span className="flame-arm right" />
      <span className="flame-leg left" />
      <span className="flame-leg right" />
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
  return <img className={`mascot-image ${className}`} src="/assets/fire-character.webp" alt={alt} />;
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
        ‹
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

export default function Home() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [alertText, setAlertText] = useState("");
  const [alertError, setAlertError] = useState(false);
  const [location, setLocation] = useState("home");
  const [withChild, setWithChild] = useState<"yes" | "no">("no");
  const [checks, setChecks] = useState([false, false, false]);
  const [sparks, setSparks] = useState(50);
  const [missionDone, setMissionDone] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [role, setRole] = useState<"guardian" | "child">("guardian");
  const [checkinSent, setCheckinSent] = useState(false);

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

  const analyzeAlert = () => {
    if (!alertText.trim()) {
      setAlertError(true);
      return;
    }
    setAlertError(false);
    navigate("situation");
  };

  const toggleCheck = (index: number) => {
    setChecks((current) =>
      current.map((checked, itemIndex) => (itemIndex === index ? !checked : checked)),
    );
  };

  const completeMission = () => {
    if (completedChecks !== checks.length) return;
    setQuizIndex(0);
    setQuizSelected(null);
    navigate("quiz");
  };

  const finishReward = () => {
    if (!missionDone) {
      setSparks((current) => current + 30);
      setMissionDone(true);
    }
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
          <span>9:41</span>
          <span>● ◒ ▰</span>
        </div>

        {screen === "onboarding" && (
          <div className="screen-content onboarding-screen">
            <header className="onboarding-brand">
              <div className="brand-lockup">
                <span className="brand-mark">!</span>
                <strong>비상비상</strong>
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
                <span className="role-avatar child-avatar">도</span>
                <span><strong>도도 어린이</strong><small>미션으로 안전 행동을 연습해요</small></span>
                <i />
              </button>
            </fieldset>

            <aside className="permission-preview">
              <span>✓</span>
              <p><strong>최소 권한으로 시작해요</strong><br />위치는 안심지도에서만, 사진은 퍼즐을 만들 때만 사용해요.</p>
            </aside>

            <button className="primary-button" onClick={() => navigate("home")}>
              비상비상 시작하기 <span>→</span>
            </button>
          </div>
        )}

        {screen === "home" && (
          <div className="screen-content home-screen">
            <header className="home-header">
              <div>
                <div className="brand-lockup">
                  <span className="brand-mark">!</span>
                  <strong>비상비상</strong>
                </div>
                <button className="location-pill" aria-label="생활 지역 설정">
                  {role === "guardian" ? "김민지 보호자" : "도도 어린이"} · 성수동 <span>⌄</span>
                </button>
              </div>
              <button className="icon-button notification-button" aria-label="알림">
                ♢
                <span className="notification-dot" />
              </button>
            </header>

            <section className="alert-hero">
              <div className="alert-copy">
                <span className="eyebrow emergency-eyebrow">
                  <span className="pulse-dot" />
                  재난문자를 받았나요?
                </span>
                <h1>
                  당황하지 말고,
                  <br />
                  지금 할 일부터 확인해요
                </h1>
                <p>문자를 붙여넣으면 우리 가족 상황에 맞춰 3가지로 정리해드려요.</p>
              </div>
              <button className="primary-button emergency-button" onClick={() => navigate("alert")}>
                재난문자 확인하기 <span>→</span>
              </button>
              <div className="alert-visual" aria-hidden="true">
                <div className="alert-wave wave-one" />
                <div className="alert-wave wave-two" />
                <div className="phone-alert-icon">!</div>
              </div>
            </section>

            <button
              className={`one-click-checkin ${checkinSent ? "sent" : ""}`}
              onClick={() => {
                setCheckinSent(true);
                navigate("checkin");
              }}
            >
              <span className="checkin-heart">{checkinSent ? "✓" : "♥"}</span>
              <span>
                <strong>{checkinSent ? "안전 알림을 보냈어요" : "1‑Click 안부 보내기"}</strong>
                <small>{role === "guardian" ? "도도에게 안부 확인을 요청해요" : "보호자에게 지금 안전하다고 알려요"}</small>
              </span>
              <span>›</span>
            </button>

            <div className="section-heading">
              <div>
                <span className="eyebrow">오늘의 안전 습관</span>
                <h2>도도와 불씨를 밝혀볼까요?</h2>
              </div>
              <span className="streak-pill">🔥 3일째</span>
            </div>

            <section className="mission-card" onClick={() => navigate("mission")}>
              <div className="mission-card-copy">
                <span className="mission-tag">집에서 · 약 5분</span>
                <h3>책상 아래 안전 자세 연습</h3>
                <p>지진이 나면 머리를 보호하고 책상 아래로 숨는 자세를 연습해요.</p>
                <div className="reward-row">
                  <span className="spark-token">✦</span>
                  <strong>불씨 30개</strong>
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
              <span className="sample-icon">☂</span>
              <span>
                <strong>호우경보 예시 불러오기</strong>
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
              onClick={() => {
                setCheckinSent(true);
                navigate("checkin");
              }}
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
              <h1>{role === "guardian" ? "도도에게 안부 확인을 보냈어요" : "엄마에게 ‘안전해요’를 보냈어요"}</h1>
              <p>{role === "guardian" ? "도도가 답하면 가족 화면에서 바로 알려드릴게요." : "김민지 보호자의 휴대폰에 지금 위치와 안전 상태가 전달됐어요."}</p>
            </section>

            <section className="checkin-detail-card">
              <div className="family-avatar-pair">
                <span className="role-avatar child-avatar">도</span>
                <span className="status-online" />
              </div>
              <div>
                <small>도도 · 초등학교 2학년</small>
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
                <span className="floor-line" />
                <span className="shoe obstacle-one">◇</span>
                <span className="box obstacle-two">□</span>
                <FlameBuddy size="large" />
              </div>
              <span className="mission-tag">집에서 · 약 5분</span>
              <h1>책상 아래<br />안전 자세 연습</h1>
              <p>지진이 나면 머리와 몸을 보호할 수 있도록 가족과 함께 안전 자세를 연습해요.</p>
            </section>

            <section className="mission-progress">
              <div>
                <strong>미션 진행률</strong>
                <span>{completedChecks} / 3 완료</span>
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
                  title: "머리와 목 보호하기",
                  copy: "두 팔로 머리와 목을 감싸고 책상 다리를 잡아요.",
                  icon: "○",
                },
              ].map((item, index) => (
                <button
                  key={item.title}
                  className={`check-item ${checks[index] ? "checked" : ""}`}
                  onClick={() => toggleCheck(index)}
                  aria-pressed={checks[index]}
                >
                  <span className="check-illustration">{item.icon}</span>
                  <span className="check-copy">
                    <strong>{item.title}</strong>
                    <small>{item.copy}</small>
                  </span>
                  <span className="checkbox">{checks[index] ? "✓" : ""}</span>
                </button>
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
                {completedChecks === checks.length ? "3단계 퀴즈 시작하기" : `${3 - completedChecks}개 더 완료해주세요`}
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {screen === "quiz" && (
          <div className="screen-content quiz-screen">
            <BackHeader title="안전 퀴즈" onBack={() => navigate("mission")} />
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
                    navigate("photoReward");
                  }
                }}
              >
                {quizIndex === quizQuestions.length - 1 ? "나의 퍼즐 만들기" : "다음 문제"}
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {screen === "photoReward" && (
          <div className="screen-content photo-reward-screen">
            <BackHeader title="나의 안전 퍼즐" onBack={() => navigate("quiz")} />
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
              <label className={`photo-puzzle-piece ${userPhoto ? "has-photo" : ""}`}>
                {userPhoto ? (
                  <img src={userPhoto} alt="사용자가 선택한 안전 미션 사진" />
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

            <button className="primary-button" onClick={finishReward}>
              퍼즐 완성하고 보상 받기 <span>→</span>
            </button>
            {!userPhoto && (
              <button className="text-button" onClick={finishReward}>사진 없이 기본 퍼즐로 완성하기</button>
            )}
          </div>
        )}

        {screen === "reward" && (
          <div className="screen-content reward-screen">
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, index) => (
                <i key={index} />
              ))}
            </div>
            <span className="reward-label">MISSION COMPLETE</span>
            <h1>나의 안전 퍼즐이<br />완성됐어요!</h1>
            <p>책상 아래 안전 자세를 기억할 특별한 한 장이 생겼어요.</p>

            <div className="reward-character-stage">
              <span className="reward-halo" />
              <span className="spark-float spark-a">✦</span>
              <span className="spark-float spark-b">✦</span>
              <span className="spark-float spark-c">✦</span>
              <MascotImage className="reward-mascot" />
            </div>

            <section className="reward-ticket">
              <span className="spark-orb large">✦</span>
              <div>
                <small>미션 보상</small>
                <strong>불씨 30개 획득!</strong>
              </div>
              <span className="total-sparks">총 {sparks}개</span>
            </section>

            <section className="unlock-card">
              <div className="unlock-icon reward-thumb">
                <img src="/assets/reward-earthquake.webp" alt="" />
              </div>
              <div>
                <small>새로운 리워드</small>
                <strong>‘지진에서 살아남기’ 퍼즐 획득</strong>
              </div>
              <span>›</span>
            </section>

            <button className="primary-button" onClick={() => navigate("guardian")}>
              리워드 보관함 확인하기 <span>→</span>
            </button>
            <button className="text-button" onClick={() => navigate("home")}>홈으로 돌아가기</button>
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
          <div className="screen-content safety-map-screen">
            <header className="safety-map-header">
              <div>
                <span className="eyebrow">성동구 안심지도</span>
                <h1>도도 주변의 안전한 곳</h1>
              </div>
              <button className="location-refresh"><span>⌖</span> 현 위치</button>
            </header>

            <section className="safety-map-canvas">
              <span className="map-street street-one" />
              <span className="map-street street-two" />
              <span className="map-street street-three" />
              <span className="route-line route-one" />
              <span className="route-line route-two" />
              <div className="route-start">
                <span className="role-avatar child-avatar">도</span>
                <small>도도</small>
              </div>
              <div className="shelter-pin shelter-main">
                <span>⌂</span>
                <strong>성수초 체육관</strong>
                <small>도보 4분</small>
              </div>
              <div className="shelter-pin shelter-sub"><span>＋</span></div>
              <div className="shelter-pin shelter-third"><span>⌂</span></div>
              <span className="map-park-label">서울숲</span>
              <span className="map-river-label">한강</span>
            </section>

            <section className="ai-route-card">
              <div className="ai-route-heading">
                <span className="ai-badge">AI</span>
                <div>
                  <small>도도 위치에 맞춘 추천 경로</small>
                  <strong>성수초등학교 체육관</strong>
                </div>
                <span className="distance-badge">280m</span>
              </div>
              <div className="route-metrics">
                <span><strong>4분</strong> 예상 도보</span>
                <span><strong>2곳</strong> 횡단보도</span>
                <span><strong>혼잡 낮음</strong> 현재 상태</span>
              </div>
              <button className="primary-button">안전 경로 보기 <span>→</span></button>
            </section>

            <section className="nearby-shelters">
              <div className="section-heading">
                <h2>주변 대피소</h2>
                <button>목록 보기</button>
              </div>
              <article>
                <span className="shelter-list-icon">⌂</span>
                <div><strong>성수초등학교 체육관</strong><small>지진 옥외대피장소 · 280m</small></div>
                <span className="open-badge">이용 가능</span>
              </article>
            </section>

            <p className="map-disclaimer">경로와 대피소 정보는 MVP 예시예요. 실제 재난 시 관계기관의 최신 안내를 우선해주세요.</p>
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
                <span className="role-avatar child-avatar">도</span>
                <strong>도도</strong>
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
                <span className="role-avatar child-avatar">도</span>
                <span className="status-online" />
              </div>
              <div>
                <small>도도 · 방과후 돌봄교실</small>
                <strong>{checkinSent ? "“엄마, 저는 안전해요!”" : "아직 안부를 확인하지 않았어요"}</strong>
                <span>{checkinSent ? "방금 전 상태 확인 · 배터리 82%" : "마지막 확인 18분 전"}</span>
              </div>
              <span className="safe-state">{checkinSent ? "안전" : "확인 필요"}</span>
            </section>

            <div className="family-action-grid">
              <button>
                <span>☎</span>
                <strong>전화하기</strong>
                <small>도도에게 전화 연결</small>
              </button>
              <button onClick={() => navigate("checkin")}>
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
                <h1>도도의 성장 기록</h1>
              </div>
              <button className="icon-button" aria-label="설정">⚙</button>
            </header>

            <section className="profile-card">
              <div className="profile-avatar">도</div>
              <div>
                <strong>도도 · 초등학교 2학년</strong>
                <span>서울 성동구 · 아파트</span>
              </div>
              <button>수정</button>
            </section>

            <section className="character-collection">
              <div className="section-heading">
                <div><span className="eyebrow">성장 캐릭터</span><h2>우리의 안전 친구들</h2></div>
                <button>도감 보기</button>
              </div>
              <div className="character-row">
                <article className="character-item unlocked">
                  <div className="character-orb fire"><MascotImage alt="" /></div>
                  <strong>불이</strong><small>Lv. 2</small>
                </article>
                <article className="character-item">
                  <div className="character-orb water"><span>●</span><i>⌁</i></div>
                  <strong>물이</strong><small>미션 2개</small>
                </article>
                <article className="character-item">
                  <div className="character-orb wind"><span>≈</span></div>
                  <strong>바람이</strong><small>잠김</small>
                </article>
                <article className="character-item">
                  <div className="character-orb earth"><span>◆</span></div>
                  <strong>땅이</strong><small>잠김</small>
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
            <button className="outline-button wide onboarding-replay" onClick={() => navigate("onboarding")}>
              온보딩 다시 보기
            </button>
          </div>
        )}

        {!["onboarding", "alert", "situation", "actions", "checkin", "mission", "quiz", "photoReward", "reward"].includes(screen) && (
          <BottomNav current={screen} onNavigate={navigate} />
        )}
      </section>
    </main>
  );
}
