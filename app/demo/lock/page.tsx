"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDisasterDetail } from "@/lib/alert-actions";

function LockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get("type") || "earthquake";
  const disasterInfo = getDisasterDetail(typeParam);

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  // 시계 업데이트 & 위치 권한 미리 요청
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);

      const month = now.getMonth() + 1;
      const date = now.getDate();
      const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
      const day = dayNames[now.getDay()];
      setCurrentDate(`${month}월 ${date}일 ${day}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    // Geolocation 미리 요청
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => { },
        () => { },
        { timeout: 3000 }
      );
    }

    return () => clearInterval(interval);
  }, []);

  // 3초 후 슬라이드인 배너, 1.5초 후 자동 이동
  useEffect(() => {
    const bannerTimer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    const redirectTimer = setTimeout(() => {
      router.push(`/alert/child?type=${typeParam}`);
    }, 4500);

    return () => {
      clearTimeout(bannerTimer);
      clearTimeout(redirectTimer);
    };
  }, [router, typeParam]);

  // 모더레이터 3회 탭 리셋
  const handleResetTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 3) {
      setShowBanner(false);
      setTapCount(0);
      router.push(`/demo/lock?type=${typeParam}`);
    }
  };

  return (
    <main className="site-stage">
      <div className="ambient-shape ambient-one" />
      <div className="ambient-shape ambient-two" />

      <section className="phone-shell lock-shell">
        {/* 상단 상태바 (프로토타입 통일) */}
        <div className="status-bar light-status">
          <span className="status-icons">
            <i className="status-wifi">📶</i>
            <i className="status-battery">🔋</i>
          </span>
          <span>{currentTime || "09:41"}</span>
        </div>

        <div className="lock-body">
          {/* 3초 후 상단 재난문자 슬라이드 인 배너 */}
          <div className={`disaster-banner ${showBanner ? "is-visible" : ""}`}>
            <div className="banner-header">
              <span className="material-symbols-rounded banner-icon">warning</span>
              <strong>긴급 재난 문자</strong>
            </div>
            <p className="banner-text">{disasterInfo.alertText}</p>
          </div>

          {/* 잠금화면 시계 영역 */}
          <div className="lock-clock-section">
            <span className="material-symbols-rounded lock-icon">lock</span>
            <div className="lock-date">{currentDate}</div>
            <div className="lock-time">{currentTime}</div>
          </div>

          {/* 잠금화면 중앙 설명 */}
          <div className="lock-desc">
            안전 알림 수신 시 위기 모드가 자동으로 실행됩니다
          </div>

          {/* 잠금화면 하단 안내 */}
          <div className="lock-swipe-hint">
            위로 쓸어올려서 잠금 해제
          </div>

          {/* 모더레이터용 44x44px 완전 투명 탭 영역 (우측 하단) */}
          <div onClick={handleResetTap} aria-hidden="true" className="moderator-tap-area" />
        </div>
      </section>

      <style jsx global>{`
        .lock-shell {
          background: #09090b !important;
          color: #ffffff;
          position: relative;
          width: min(100%, 430px) !important;
          min-height: 860px !important;
          height: 860px !important;
          display: flex;
          flex-direction: column;
        }

        .light-status {
          color: #e4e4e7 !important;
          padding: 14px 20px 6px 20px;
          height: 38px;
          box-sizing: border-box;
        }

        .lock-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: calc(860px - 38px);
          padding: 24px 20px 36px 20px;
          box-sizing: border-box;
          position: relative;
          user-select: none;
          -webkit-user-select: none;
        }

        .disaster-banner {
          position: absolute;
          top: 12px;
          left: 14px;
          right: 14px;
          z-index: 50;
          background: rgba(225, 29, 72, 0.95);
          color: #ffffff;
          padding: 16px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(225, 29, 72, 0.5);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(254, 202, 202, 0.4);
          transform: translateY(-150%);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }

        .disaster-banner.is-visible {
          transform: translateY(0);
          opacity: 1;
        }

        .banner-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .banner-icon {
          font-size: 20px;
          color: #fef08a;
        }

        .banner-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
        }

        .lock-clock-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 50px;
        }

        .lock-icon {
          font-size: 26px;
          color: #a1a1aa;
          margin-bottom: 12px;
        }

        .lock-date {
          font-size: 18px;
          font-weight: 600;
          color: #d4d4d8;
          margin-bottom: 4px;
        }

        .lock-time {
          font-size: 72px;
          font-weight: 800;
          letter-spacing: -2px;
        }

        .lock-desc {
          text-align: center;
          color: #71717a;
          font-size: 13px;
        }

        .lock-swipe-hint {
          text-align: center;
          color: #a1a1aa;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .moderator-tap-area {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 44px;
          height: 44px;
          opacity: 0;
          z-index: 100;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}

export default function LockDemoPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "#09090b", height: "100dvh" }} />}>
      <LockContent />
    </Suspense>
  );
}
