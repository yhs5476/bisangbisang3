"use client";

import { useMemo, useState } from "react";
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
  return <img className={`mascot-image ${className}`} src="/assets/fire-character.png" alt={alt} />;
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

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login");
  const [alertText, setAlertText] = useState("");
  const [alertError, setAlertError] = useState(false);
  const [location, setLocation] = useState("home");
  const [withChild, setWithChild] = useState<"yes" | "no">("no");
  const [checks, setChecks] = useState([false, false, false, false]);
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
                  <span className="brand-mark">!</span>
                  <strong>비상비상</strong>
                </div>
                <button className="location-pill" aria-label="생활 지역 설정">
                  {role === "guardian" ? "김민지 보호자" : "도도 어린이"} · 성수동 <span>⌄</span>
                </button>
              </div>
              <button className="icon-button notification-button" aria-label="리워드 보상 센터" onClick={() => navigate("reward")}>
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
              onClick={openCheckin}
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

            {/* 신규: 재난상황 시뮬레이션 이동 버튼 */}
            <button
              className="primary-button wide"
              style={{
                marginTop: "12px",
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

            <button className="primary-button" onClick={finishReward}>
              퍼즐 완성하고 보상 받기 <span>→</span>
            </button>
            {!userPhoto && (
              <button className="text-button" onClick={finishReward}>사진 없이 기본 퍼즐로 완성하기</button>
            )}
          </div>
        )}

        {screen === "reward" && (
          <div className="screen-content reward-center-screen">
            <BackHeader title="보상 센터" onBack={() => navigate("home")} />

            <section className="reward-profile-hero">
              <div className="child-hero-avatar">
                <span className="hero-avatar-circle">도</span>
                <div>
                  <strong>도도 어린이</strong>
                  <small>성수동 · 안전 대장</small>
                </div>
              </div>

              <div className="reward-tier-card">
                <div className="tier-badge-row">
                  <div>
                    <span className="tier-tag">3단계 달성! 🔥</span>
                    <h2>맞춤형 안전 키트 달성!</h2>
                  </div>
                  <span className="gold-check-seal">✔</span>
                </div>
                <div className="tier-pts-info">
                  <span>현재 달성 포인트</span>
                  <strong>20,000 / 20,000 Pts</strong>
                </div>
                <div className="progress-track reward-track">
                  <span style={{ width: "100%" }} />
                </div>
                <button
                  className="primary-button kit-shipment-btn"
                  onClick={() => alert("도도 어린이의 맞춤형 안전 키트 배송 신청 및 조회가 진행됩니다!")}
                >
                  🚚 키트 배송 조회 및 신청
                </button>
              </div>
            </section>

            <section className="reward-roadmap">
              <div className="roadmap-step done">
                <span className="step-num">1단계</span>
                <strong>캐릭터 성장</strong>
                <small>불이 Lv.2</small>
              </div>
              <span className="step-arrow">›</span>
              <div className="roadmap-step done">
                <span className="step-num">2단계</span>
                <strong>맞춤형 만화책</strong>
                <small>안전 퍼즐</small>
              </div>
              <span className="step-arrow">›</span>
              <div className="roadmap-step current">
                <span className="step-num">3단계</span>
                <strong>실생활 키트</strong>
                <small>실물 보상</small>
              </div>
            </section>

            <section className="kit-items-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">나만의 맞춤형 재난 대비 키트</span>
                  <h2>실물 보상 + 실생활 연계 키트</h2>
                </div>
                <span className="kit-badge">실물 수령</span>
              </div>

              <div className="kit-grid">
                <article className="kit-card">
                  <span className="kit-icon">🎒</span>
                  <div>
                    <span className="kit-tag">백팩</span>
                    <strong>도도의 맞춤형 안전 백팩</strong>
                    <p>도도 캐릭터 패치와 진화 정보가 그대로 반영된 비상 가방</p>
                  </div>
                  <span className="status-earned">획득 완료</span>
                </article>

                <article className="kit-card">
                  <span className="kit-icon">🔥</span>
                  <div>
                    <span className="kit-tag">소방 담요</span>
                    <strong>맞춤형 불이 소방 담요</strong>
                    <p>화재 발생 시 체온 유지 및 불길로부터 몸을 보호하는 담요</p>
                  </div>
                  <span className="status-earned">획득 완료</span>
                </article>

                <article className="kit-card">
                  <span className="kit-icon">🔊</span>
                  <div>
                    <span className="kit-tag">호루라기 & 손전등</span>
                    <strong>캐릭터 호루라기 & LED 랜턴</strong>
                    <p>위급 상황 구조 신호를 위한 호루라기와 고성능 플래시</p>
                  </div>
                  <span className="status-earned">획득 완료</span>
                </article>

                <article className="kit-card">
                  <span className="kit-icon">🍞</span>
                  <div>
                    <span className="kit-tag">비상식량</span>
                    <strong>비상식량 3종 세트</strong>
                    <p>재난 발생 시 긴급 체력 보충을 위한 안전 구호 식량</p>
                  </div>
                  <span className="status-earned">획득 완료</span>
                </article>

                <article className="kit-card">
                  <span className="kit-icon">📖</span>
                  <div>
                    <span className="kit-tag">안전 가이드북</span>
                    <strong>불이와 함께하는 안전 만화책</strong>
                    <p>도도가 직접 주인공으로 등장하는 재난 대응 만화책</p>
                  </div>
                  <span className="status-earned">획득 완료</span>
                </article>
              </div>
            </section>

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
                  <div className="character-orb fire">
                    <img src="/assets/fire-character.png" alt="불이" />
                  </div>
                  <strong>불이</strong><small>Lv. 2</small>
                </article>
                <article className="character-item unlocked">
                  <span className="character-badge-heart">❤️</span>
                  <div className="character-orb water">
                    <img src="/assets/water-character.png" alt="물이" />
                  </div>
                  <strong>물이</strong><small>Lv. 1</small>
                </article>
                <article className="character-item unlocked">
                  <div className="character-orb wind">
                    <img src="/assets/wind-character.png" alt="바람이" />
                  </div>
                  <strong>바람이</strong><small>Lv. 1</small>
                </article>
                <article className="character-item unlocked">
                  <div className="character-orb earth">
                    <img src="/assets/earth-character.png" alt="땅이" />
                  </div>
                  <strong>땅이</strong><small>Lv. 1</small>
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
      </section>
    </main>
  );
}
