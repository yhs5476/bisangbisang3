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

  const [realAlertText, setRealAlertText] = useState<string | null>(null);
  const [loadingRealAlert, setLoadingRealAlert] = useState(false);

  const [detectedType, setDetectedType] = useState<string>(typeParam);

  const [recentAlertsList, setRecentAlertsList] = useState<Array<{ msg: string; date: string; region: string; type: string }>>([]);
  const [showRecentModal, setShowRecentModal] = useState(false);

  // 실시간 공공 긴급재난문자 API 불러오기
  useEffect(() => {
    async function fetchRealAlert() {
      setLoadingRealAlert(true);
      try {
        const res = await fetch("/api/disaster-alert?numOfRows=20");
        if (res.ok) {
          const data = await res.json();
          // API 응답 구조 추출
          const list = Array.isArray(data) ? data : data?.body || data?.data || data?.result || [];
          if (list && list.length > 0) {
            // 실종 제외된 목록 정제해서 저장
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

            // URL 파라미터가 명시된 경우 우선 탐색
            const keywordMap: Record<string, string[]> = {
              earthquake: ["지진", "진도", "여진"],
              flood: ["호우", "비", "침수", "태풍", "하천", "폭염", "무더위", "물놀이", "싱크홀", "교통통제"],
              fire: ["화재", "산불", "불"],
              missing: ["실종", "찾습니다", "배회"],
            };
            const searchKeywords = keywordMap[typeParam] || [];

            const matchedAlert = list.find((item: any) => {
              const msgContent = item.MSG_CN || item.MSG || "";
              const categoryName = item.DST_SE_NM || "";
              return searchKeywords.some(kw => msgContent.includes(kw) || categoryName.includes(kw));
            }) || list[0];

            let msg = matchedAlert.MSG_CN || matchedAlert.MSG || matchedAlert.msg_cn || matchedAlert.CRT_DT_MSG || matchedAlert.SJ;
            if (typeof msg === "string") {
              msg = msg.replace(/https?:\/\/vo\.la\/\S+|vo\.la\/\S+/gi, "").replace(/\s*\/\s*$/g, "").trim();
              setRealAlertText(msg);

              // 문자 내용 분석 후 재난 유형 자동으로 감지
              let typeFound = "flood";
              if (msg.includes("지진") || msg.includes("진도") || msg.includes("여진")) {
                typeFound = "earthquake";
              } else if (msg.includes("화재") || msg.includes("산불") || msg.includes("불연기")) {
                typeFound = "fire";
              } else if (msg.includes("실종") || msg.includes("찾습니다")) {
                typeFound = "missing";
              } else {
                typeFound = "flood";
              }
              setDetectedType(typeFound);
            }
          }
        }
      } catch (err) {
        console.error("긴급재난문자 API 불러오기 실패:", err);
      } finally {
        setLoadingRealAlert(false);
      }
    }
    fetchRealAlert();
  }, [typeParam]);

  // 3초 후 슬라이드인 배너, 1.5초 후 재난 문자에 맞는 행동 지침 화면으로 이동
  useEffect(() => {
    const bannerTimer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    const redirectTimer = setTimeout(() => {
      router.push(`/alert/child?type=${detectedType}`);
    }, 4500);

    return () => {
      clearTimeout(bannerTimer);
      clearTimeout(redirectTimer);
    };
  }, [router, detectedType]);

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
              <span className="live-api-tag">
                {realAlertText ? "실시간 연동" : "시뮬레이션"}
              </span>
            </div>
            <p className="banner-text">
              {realAlertText ? realAlertText : disasterInfo.alertText}
            </p>
          </div>

          {/* 잠금화면 시계 영역 */}
          <div className="lock-clock-section">
            <span className="material-symbols-rounded lock-icon">lock</span>
            <div className="lock-date">{currentDate}</div>
            <div className="lock-time">{currentTime}</div>
          </div>

          {/* 잠금화면 중앙 설명 및 최근 재난문자 확인 버튼 */}
          <div className="lock-center-actions">
            <div className="lock-desc">
              안전 알림 수신 시 위기 모드가 자동으로 실행됩니다
            </div>
            <button
              className="recent-alerts-btn"
              onClick={() => setShowRecentModal(true)}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>list_alt</span>
              <span>최근 긴급재난문자 목록 ({recentAlertsList.length})</span>
            </button>
          </div>

          {/* 최근 긴급재난문자 모달 (실종신고 제외) */}
          {showRecentModal && (
            <div className="recent-modal-overlay" onClick={() => setShowRecentModal(false)}>
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

        .live-api-tag {
          margin-left: auto;
          font-size: 10px;
          background: rgba(255, 255, 255, 0.25);
          padding: 2px 7px;
          border-radius: 10px;
          font-weight: 700;
          letter-spacing: -0.3px;
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

        .lock-center-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 10;
        }

        .recent-alerts-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e4e4e7;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }

        .recent-alerts-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
        }

        .recent-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          animation: fadeIn 0.2s ease;
        }

        .recent-modal-card {
          width: 100%;
          max-height: 75vh;
          background: rgba(18, 18, 20, 0.92);
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
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
        }

        .recent-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 14px;
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
        }

        .recent-item {
          background: rgba(255, 255, 255, 0.04);
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          transition: transform 0.15s ease, background 0.15s ease;
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
          width: 100%;
        }

        .recent-tag {
          background: rgba(225, 29, 72, 0.15);
          color: #fb7185;
          border: 1px solid rgba(225, 29, 72, 0.35);
          padding: 3px 8px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: -0.2px;
          white-space: nowrap;
          word-break: keep-all;
          flex-shrink: 0;
          display: inline-block;
          line-height: 1.2;
        }

        .recent-region {
          color: #f4f4f5;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: -0.2px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
          flex: 1;
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
