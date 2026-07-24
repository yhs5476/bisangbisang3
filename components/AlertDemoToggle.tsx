"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DisasterType } from "@/lib/alert-actions";
import { useAlert } from "@/lib/alert-context";

export default function AlertDemoToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = (searchParams?.get("type") as DisasterType) || "earthquake";
  const { demoMode, setDemoMode, enableGps, setEnableGps } = useAlert();

  const changeType = (type: DisasterType) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("type", type);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-zinc-900/90 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg border border-zinc-700 backdrop-blur"
        style={{
          backgroundColor: "#18181b",
          color: "#ffffff",
          padding: "8px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "bold",
          border: "1px solid #3f3f46",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
      >
        <span>🛠️ 데모 토글</span>
      </button>

      {isOpen && (
        <div
          className="absolute bottom-12 right-0 w-64 bg-zinc-900 text-white p-4 rounded-xl shadow-2xl border border-zinc-700 flex flex-col gap-3"
          style={{
            backgroundColor: "#18181b",
            color: "#ffffff",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #3f3f46",
            width: "270px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold" }}>재난 유형 전환</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {(["earthquake", "flood", "fire", "missing"] as DisasterType[]).map((t) => (
              <button
                key={t}
                onClick={() => changeType(t)}
                style={{
                  padding: "6px 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: currentType === t ? "bold" : "normal",
                  backgroundColor: currentType === t ? "#dc2626" : "#27272a",
                  color: "#ffffff",
                  border: "1px solid " + (currentType === t ? "#ef4444" : "#3f3f46"),
                  cursor: "pointer",
                }}
              >
                {t === "earthquake" && "🌋 지진"}
                {t === "flood" && "🌊 큰비"}
                {t === "fire" && "🔥 불"}
                {t === "missing" && "🔍 실종"}
              </button>
            ))}
          </div>

          <hr style={{ borderColor: "#3f3f46", margin: "4px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#d4d4d8" }}>GPS 장소 추천</span>
            <button
              onClick={() => setEnableGps(!enableGps)}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "bold",
                backgroundColor: enableGps ? "#2563eb" : "#52525b",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {enableGps ? "ON (장소 뱃지)" : "OFF (일반 문구)"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#d4d4d8" }}>DEMO_MODE (가짜통화)</span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "bold",
                backgroundColor: demoMode ? "#16a34a" : "#52525b",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {demoMode ? "ON" : "OFF"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            <button
              onClick={() => router.push("/demo/lock?type=" + currentType)}
              style={{
                flex: 1,
                padding: "6px",
                borderRadius: "8px",
                fontSize: "11px",
                backgroundColor: "#3f3f46",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              잠금화면 데모
            </button>
            <button
              onClick={() => router.push("/alert/child?type=" + currentType)}
              style={{
                flex: 1,
                padding: "6px",
                borderRadius: "8px",
                fontSize: "11px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              위기모드 바로가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
