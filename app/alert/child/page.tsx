"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getDisasterDetail, DisasterType } from "@/lib/alert-actions";
import { getPersonalizedActions } from "@/lib/curated-places";
import { useAlert } from "@/lib/alert-context";
import AlertDemoToggle from "@/components/AlertDemoToggle";

interface GeoCoords {
  lat: number;
  lng: number;
}

const DEFAULT_COORDS: GeoCoords = { lat: 37.5635, lng: 127.0365 }; // 서울 성동구 기본 위치

function ChildAlertContent() {
  const searchParams = useSearchParams();
  const typeParam = (searchParams?.get("type") as DisasterType) || "earthquake";
  const disasterHeader = getDisasterDetail(typeParam);

  const { demoMode, enableGps } = useAlert();

  // 위치 상태
  const [coords, setCoords] = useState<GeoCoords>(DEFAULT_COORDS);

  // 모달/가짜화면 상태
  const [activeModal, setActiveModal] = useState<"none" | "call_mom" | "119_confirm" | "119_call" | "send_location">("none");
  const [momCallConnected, setMomCallConnected] = useState(false);

  // 최근 재난문자 목록 모달 상태
  const [recentAlertsList, setRecentAlertsList] = useState<Array<{ msg: string; date: string; region: string; type: string }>>([]);
  const [showRecentModal, setShowRecentModal] = useState(false);

  // 0. 실시간 공공 긴급재난문자 목록 불러오기 (실종 제외)
  useEffect(() => {
    async function fetchRecentAlerts() {
      try {
        const res = await fetch("/api/disaster-alert?numOfRows=20");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.body || data?.data || data?.result || [];
          if (list && list.length > 0) {
            const formattedList = list.map((item: any) => {
              let msg = item.MSG_CN || item.MSG || item.msg_cn || item.CRT_DT_MSG || item.SJ || "";
              msg = msg.replace(/https?:\/\/vo\.la\/\S+|vo\.la\/\S+/gi, "").replace(/\s*\/\s*$/g, "").trim();
              return {
                msg,
                date: item.CRT_DT || item.REG_YMD || "최근",
                region: item.RCPTN_RGN_NM?.trim() || "전국",
                type: item.DST_SE_NM || "안전안내",
              };
            });
            setRecentAlertsList(formattedList);
          }
        }
      } catch (err) {
        console.error("최근 재난문자 불러오기 실패:", err);
      }
    }
    fetchRecentAlerts();
  }, []);

  // 1. Geolocation 3초 타임아웃 위치 획득 (에러 시 성동구 폴백)
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      const timer = setTimeout(() => {
        // 3초 타임아웃 폴백
      }, 3000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          });
        },
        () => {
          clearTimeout(timer);
          setCoords(DEFAULT_COORDS);
        },
        { timeout: 3000 }
      );
    }
  }, []);

  // 2. Screen Wake Lock API 적용
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator && (navigator as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock) {
        try {
          wakeLock = await (navigator as { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request("screen");
        } catch {
          // 지원하지 않거나 거부 시 조용히 무시
        }
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock && wakeLock.release) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // GPS 개인화 3줄 행동 가이드 데이터 획득
  const actions = getPersonalizedActions(typeParam, enableGps);

  // 1. 엄마에게 전화
  const handleCallMom = () => {
    if (demoMode) {
      setActiveModal("call_mom");
      setMomCallConnected(false);
      setTimeout(() => {
        setMomCallConnected(true);
      }, 3000);
    } else {
      const guardianPhone = localStorage.getItem("guardian_phone") || "010-0000-0000";
      window.location.href = `tel:${guardianPhone}`;
    }
  };

  // 2. 119 신고
  const handle119Click = () => {
    setActiveModal("119_confirm");
  };

  const confirm119Call = () => {
    if (demoMode) {
      setActiveModal("119_call");
    } else {
      // DEMO_MODE가 false일 때만 tel:119 경로 실행
      window.location.href = "tel:" + "119";
    }
  };

  // 3. 내 위치 알리기
  const handleSendLocation = () => {
    if (demoMode) {
      setActiveModal("send_location");
    } else {
      const guardianPhone = localStorage.getItem("guardian_phone") || "";
      const message = `[위급 상황] 내 위치: https://maps.google.com/?q=${coords.lat},${coords.lng}`;
      if (guardianPhone) {
        window.location.href = `sms:${guardianPhone}?body=${encodeURIComponent(message)}`;
      } else {
        navigator.clipboard.writeText(message);
        alert("위치가 클립보드에 복사되었습니다.");
      }
    }
  };

  return (
    <main className="site-stage">
      <div className="ambient-shape ambient-one" />
      <div className="ambient-shape ambient-two" />

      <section className="phone-shell alert-phone-shell">
        {/* 프로토타입 통일 상단 상태바 */}
        <div className="status-bar light-status">
          <span className="status-icons">
            <i className="status-wifi">📶</i>
            <i className="status-battery">🔋</i>
          </span>
          <span>09:41</span>
        </div>

        <div className="child-alert-root">
          {/* WCAG 2.3.1 광과민성 발작 안전 배경 (1.4초 주기, 0.7Hz) */}
          <div className="alert-pulse-bg" />

          <div className="child-alert-container">
            {/* 상단 Header */}
            <header className="alert-header">
              <div className="header-top-row">
                <div className="disaster-badge">
                  <span className="material-symbols-rounded disaster-badge-icon">
                    {disasterHeader.icon}
                  </span>
                  <span className="disaster-badge-label">{disasterHeader.label}</span>
                </div>
                <button
                  className="recent-alerts-header-btn"
                  onClick={() => setShowRecentModal(true)}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>list_alt</span>
                  <span>최근 재난문자</span>
                </button>
              </div>
              <h1 className="disaster-headline">{disasterHeader.headline}</h1>
            </header>

            {/* 행동 요령 3가지 2단 구조 카드 (행동 문장 + 시각 단서 장소 뱃지) */}
            <section className="actions-section">
              {actions.map((act) => (
                <div key={act.order} className="action-card-2tier">
                  <div className="action-card-top">
                    <div className="action-number">{act.order}</div>
                    <span className="material-symbols-rounded action-icon">
                      {act.icon}
                    </span>
                    <span className="action-text">{act.childText}</span>
                  </div>

                  {/* 장소가 존재할 때만 2단 뱃지 노출 (없으면 숨김) */}
                  {act.place && (
                    <div className="action-place-badge">
                      <span className="place-cue-name">
                        {act.place.visualCue} {act.place.name}
                        {act.place.targetLabel ? ` (${act.place.targetLabel})` : ""}
                      </span>
                      <span className="place-dot">·</span>
                      <span className="place-walk">걸어서 {act.place.walkMinutes}분</span>
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* 하단 고정 액션 버튼 3개 */}
            <footer className="alert-footer-actions">
              <button className="footer-btn btn-mom" onClick={handleCallMom}>
                <span className="material-symbols-rounded btn-icon">call</span>
                <span>엄마에게 전화</span>
              </button>

              <button className="footer-btn btn-119" onClick={handle119Click}>
                <span className="material-symbols-rounded btn-icon">sos</span>
                <span>119 신고</span>
              </button>

              <button className="footer-btn btn-location" onClick={handleSendLocation}>
                <span className="material-symbols-rounded btn-icon">my_location</span>
                <span>내 위치 알리기</span>
              </button>
            </footer>
          </div>
        </div>
      </section>

      {/* 모달 시뮬레이션 UI들 */}

      {/* 1. 엄마에게 전화 (DEMO_MODE) */}
      {activeModal === "call_mom" && (
        <div className="alert-modal-overlay">
          <div className="alert-modal-card">
            <span className="material-symbols-rounded modal-hero-icon pulse-animation">
              phone_in_talk
            </span>
            <h2 className="modal-title">엄마에게 전화 연결 중</h2>
            <p className="modal-desc">
              {momCallConnected ? "🟢 엄마와 연결되었습니다!" : "신호를 보내고 있어요 (3초 후 연결)..."}
            </p>
            <button
              className="modal-close-btn"
              onClick={() => setActiveModal("none")}
            >
              통화 종료
            </button>
          </div>
        </div>
      )}

      {/* 2-1. 119 신고 확인 모달 */}
      {activeModal === "119_confirm" && (
        <div className="alert-modal-overlay">
          <div className="alert-modal-card border-danger">
            <span className="material-symbols-rounded modal-hero-icon color-danger">
              warning
            </span>
            <h2 className="modal-title">119에 신고할까요?</h2>
            <p className="modal-desc">진짜 위급할 때만 119를 불러요!</p>
            <div className="modal-btn-row">
              <button
                className="modal-cancel-btn"
                onClick={() => setActiveModal("none")}
              >
                취소
              </button>
              <button className="modal-confirm-btn" onClick={confirm119Call}>
                네, 119 신고
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-2. 119 가짜 연결 모달 (DEMO_MODE) */}
      {activeModal === "119_call" && (
        <div className="alert-modal-overlay">
          <div className="alert-modal-card">
            <span className="material-symbols-rounded modal-hero-icon color-danger pulse-animation">
              emergency
            </span>
            <h2 className="modal-title">[시뮬레이션] 119 연결 완료</h2>
            <p className="modal-desc">
              구급대원에게 위치와 상황을 전달하고 있습니다. (실제 119에는 전화되지 않았습니다)
            </p>
            <button
              className="modal-close-btn"
              onClick={() => setActiveModal("none")}
            >
              확인 (닫기)
            </button>
          </div>
        </div>
      )}

      {/* 3. 내 위치 알리기 모달 (DEMO_MODE) */}
      {activeModal === "send_location" && (
        <div className="alert-modal-overlay">
          <div className="alert-modal-card">
            <span className="material-symbols-rounded modal-hero-icon color-success">
              location_on
            </span>
            <h2 className="modal-title">엄마에게 위치를 보냈어요!</h2>
            <p className="modal-desc">
              내 현재 위치가 보호자에게 전송되었습니다.
            </p>
            {/* 디버깅용 소형 좌표 텍스트 */}
            <div className="debug-coords">
              📍 현재 좌표: 위도 {coords.lat}, 경도 {coords.lng} (성동구 기준)
            </div>
            <button
              className="modal-close-btn"
              onClick={() => setActiveModal("none")}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 4. 최근 긴급재난문자 목록 모달 (실종신고 제외) */}
      {showRecentModal && (
        <div className="alert-modal-overlay" onClick={() => setShowRecentModal(false)}>
          <div className="recent-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="recent-modal-header">
              <div>
                <h3>최근 긴급재난문자</h3>
                <small>실종 알림 제외 · 순수 재난/방재 문자</small>
              </div>
              <button className="recent-modal-close" onClick={() => setShowRecentModal(false)}>
                ✕
              </button>
            </header>
            <div className="recent-modal-body">
              {recentAlertsList.length === 0 ? (
                <div className="recent-empty">불러온 재난문자가 없습니다.</div>
              ) : (
                recentAlertsList.map((item, idx) => (
                  <div key={idx} className="recent-item">
                    <div className="recent-item-meta">
                      <span className="recent-tag">{item.type}</span>
                      <span className="recent-region">{item.region}</span>
                      <span className="recent-date">{item.date}</span>
                    </div>
                    <p className="recent-item-msg">{item.msg}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 개발용 토글 */}
      <AlertDemoToggle />

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          font-family: "Plus Jakarta Sans", "Roboto Flex", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
      `}</style>

      <style jsx>{`
        .alert-phone-shell {
          position: relative;
          background: #1a0505 !important;
          width: min(100%, 430px) !important;
          min-height: 860px !important;
          height: 860px !important;
          display: flex;
          flex-direction: column;
        }

        .light-status {
          color: #e4e4e7 !important;
          position: relative;
          z-index: 20;
          padding: 14px 20px 6px 20px;
          height: 38px;
          box-sizing: border-box;
        }

        .child-alert-root {
          position: relative;
          width: 100%;
          height: calc(860px - 38px);
          overflow: hidden;
          background-color: #1a0505;
          color: #ffffff;
          font-family: "Plus Jakarta Sans", "Roboto Flex", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* WCAG 2.3.1 기준 광과민성 발작 안전 1.4초 주기 (약 0.7Hz) 배경 전환 */
        .alert-pulse-bg {
          position: absolute;
          inset: 0;
          background-color: #8b0000;
          opacity: 0.85;
          animation: pulseDeepRed 1.4s ease-in-out infinite alternate;
          z-index: 1;
        }

        @keyframes pulseDeepRed {
          0% {
            opacity: 0.55;
          }
          100% {
            opacity: 1;
          }
        }

        /* prefers-reduced-motion 기준 대응 */
        @media (prefers-reduced-motion: reduce) {
          .alert-pulse-bg {
            animation: none;
            opacity: 1;
          }
        }

        .child-alert-container {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          padding: 24px 20px 32px 20px;
          box-sizing: border-box;
        }

        /* 상단 Header */
        .alert-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 8px;
        }

        .header-top-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .recent-alerts-header-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #f4f4f5;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }

        .recent-alerts-header-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .disaster-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.45);
          border: 1.5px solid #ffd45f;
          padding: 6px 18px;
          border-radius: 9999px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .disaster-badge-icon {
          color: #ffd45f;
          font-size: 22px;
        }

        .disaster-badge-label {
          color: #ffffff;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .disaster-headline {
          margin: 0;
          font-size: 28px; /* 24px 이상 지침 */
          font-weight: 800;
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
          line-height: 1.3;
          letter-spacing: -0.5px;
        }

        /* 2단 구조 행동 카드 (860px 폰 화면에 알맞게 균등 분배) */
        .actions-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 16px 0;
          flex: 1;
          justify-content: center;
        }

        .action-card-2tier {
          min-height: 110px;
          background: rgba(24, 8, 8, 0.88);
          border: 2px solid rgba(255, 255, 255, 0.18);
          border-radius: 24px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(12px);
        }

        .action-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .action-number {
          width: 40px;
          height: 40px;
          min-width: 40px;
          background: #ffd45f;
          color: #18332d;
          font-size: 24px;
          font-weight: 900;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .action-icon {
          font-size: 34px;
          color: #ffffff;
          min-width: 34px;
        }

        .action-text {
          font-size: 23px; /* 최소 22px 지침 */
          font-weight: 800;
          color: #ffffff;
          line-height: 1.25;
          word-break: keep-all;
          letter-spacing: -0.3px;
        }

        /* 2단 장소 뱃지 */
        .action-place-badge {
          align-self: flex-start;
          margin-left: 54px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 212, 95, 0.18);
          border: 1px solid rgba(255, 212, 95, 0.55);
          color: #fef08a;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.3;
        }

        .place-cue-name {
          color: #ffffff;
        }

        .place-dot {
          color: #ffd45f;
          opacity: 0.8;
        }

        .place-walk {
          color: #fef08a;
        }

        /* 하단 고정 액션 버튼 3개 */
        .alert-footer-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-top: auto;
        }

        .footer-btn {
          min-height: 68px;
          border-radius: 20px;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
          transition: transform 0.15s ease;
          padding: 8px 4px;
          letter-spacing: -0.3px;
        }

        .footer-btn:active {
          transform: scale(0.96);
        }

        .btn-icon {
          font-size: 26px;
        }

        .btn-mom {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-119 {
          background: linear-gradient(135deg, #e95042, #dc2626);
          border: 2px solid #fca5a5;
        }

        .btn-location {
          background: linear-gradient(135deg, #37b97a, #195c49);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* 모달 스타일 */
        .alert-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .alert-modal-card {
          width: 100%;
          max-width: 360px;
          background: #18181b;
          border: 2px solid #3f3f46;
          border-radius: 24px;
          padding: 28px 20px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
          color: #ffffff;
          font-family: "Plus Jakarta Sans", "Roboto Flex", "Noto Sans KR", sans-serif;
        }

        .alert-modal-card.border-danger {
          border-color: #ef4444;
        }

        .modal-hero-icon {
          font-size: 56px;
          color: #60a5fa;
          margin-bottom: 12px;
        }

        .modal-hero-icon.color-danger {
          color: #ef4444;
        }

        .modal-hero-icon.color-success {
          color: #4ade80;
        }

        .pulse-animation {
          animation: iconPulse 1s infinite alternate;
        }

        @keyframes iconPulse {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.15);
          }
        }

        .modal-title {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 8px 0;
          letter-spacing: -0.3px;
        }

        .modal-desc {
          font-size: 15px;
          color: #d4d4d8;
          line-height: 1.4;
          margin: 0 0 20px 0;
        }

        .debug-coords {
          background: #27272a;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          color: #a1a1aa;
          margin-bottom: 16px;
        }

        .modal-close-btn {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: none;
          background: #3f3f46;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .modal-btn-row {
          display: flex;
          gap: 10px;
        }

        .modal-cancel-btn {
          flex: 1;
          padding: 14px;
          border-radius: 16px;
          border: none;
          background: #3f3f46;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .modal-confirm-btn {
          flex: 1;
          padding: 14px;
          border-radius: 16px;
          border: none;
          background: #e95042;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .recent-modal-card {
          width: 100%;
          max-width: 430px;
          max-height: 75vh;
          background: rgba(18, 18, 20, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top-left-radius: 28px;
          border-top-right-radius: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          flex-direction: column;
          padding: 22px 20px 28px 20px;
          box-sizing: border-box;
          color: #ffffff;
          margin-top: auto;
          margin-bottom: 0;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
        }

        .recent-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 14px;
          text-align: left;
        }

        .recent-modal-header h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #f4f4f5;
          letter-spacing: -0.3px;
        }

        .recent-modal-header small {
          color: #71717a;
          font-size: 11px;
          font-weight: 500;
          display: block;
          margin-top: 2px;
        }

        .recent-modal-close {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #a1a1aa;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .recent-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .recent-modal-body {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 2px;
          max-height: 55vh;
        }

        .recent-item {
          background: rgba(255, 255, 255, 0.04);
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          text-align: left;
          transition: background 0.15s ease;
        }

        .recent-item:hover {
          background: rgba(255, 255, 255, 0.07);
        }

        .recent-item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .recent-tag {
          background: rgba(225, 29, 72, 0.15);
          color: #fb7185;
          border: 1px solid rgba(225, 29, 72, 0.3);
          padding: 2px 8px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: -0.2px;
        }

        .recent-region {
          color: #f4f4f5;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: -0.2px;
          line-height: 1.3;
        }

        .recent-date {
          margin-left: auto;
          color: #52525b;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .recent-item-msg {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #d4d4d8;
          word-break: keep-all;
          font-weight: 400;
        }

        .recent-empty {
          text-align: center;
          padding: 40px 0;
          color: #71717a;
          font-size: 13px;
        }
      `}</style>
    </main>
  );
}

export default function ChildAlertPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "#8b0000", height: "100dvh" }} />}>
      <ChildAlertContent />
    </Suspense>
  );
}
