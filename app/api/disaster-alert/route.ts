import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceKey =
    process.env.DISASTER_API_KEY ||
    searchParams.get("serviceKey") ||
    "45OXT7682D1L49IA";
  const pageNo = searchParams.get("pageNo") || "1";
  const numOfRows = searchParams.get("numOfRows") || "10";

  // 재난안전데이터 공유플랫폼 긴급재난문자 API 엔드포인트 (실종 제외 후 유효 재난문자를 얻기 위해 50건 요청)
  const fetchRows = Math.max(parseInt(numOfRows, 10) * 5, 50);
  const targetUrl = `https://www.safetydata.go.kr/V2/api/DSSP-IF-00247?serviceKey=${encodeURIComponent(
    serviceKey
  )}&pageNo=${pageNo}&numOfRows=${fetchRows}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 30 }, // 30초 캐싱
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `공공 API 호출 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 실종/경찰청 관련 안내문자 필터링 (순수 재난/방재 문자만 추출)
    if (data && Array.isArray(data.body)) {
      data.body = data.body.filter((item: any) => {
        const msg = item.MSG_CN || item.MSG || "";
        const isMissing =
          msg.includes("실종") ||
          msg.includes("찾습니다") ||
          msg.includes("배회") ||
          msg.includes("경찰청") ||
          msg.includes("☎182") ||
          msg.includes("182");
        return !isMissing;
      });
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "긴급재난문자 API 연동 중 오류 발생" },
      { status: 500 }
    );
  }
}
