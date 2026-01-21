import { NextResponse } from "next/server";

const VWORLD_KEY = process.env.NEXT_PUBLIC_VWORLD_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lng = searchParams.get("lng");
  const lat = searchParams.get("lat");

  if (!lng || !lat || !VWORLD_KEY) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // 🚀 개발자님이 보신 그 API (Data API) 사용!
  // 장점: bbox 계산 안 해도 됨, 그냥 점(POINT)만 찍어서 보내면 찾아줌.
  const url = `https://api.vworld.kr/req/data?` +
    `service=data` +
    `&request=GetFeature` +
    `&data=LP_PA_CBND_BUBUN` + // 92번 API (연속지적도)
    `&key=${VWORLD_KEY}` +
    `&domain=localhost` +
    `&format=json` +           // JSON으로 주세요
    `&geomFilter=POINT(${lng} ${lat})` + // 👈 "이 좌표를 포함하는 땅을 찾아라"
    `&geometry=true` +         // 땅 모양(Polygon)도 같이 줘
    `&crs=EPSG:4326`;          // 위경도 좌표계

  try {
    console.log("Fetching VWorld Data API:", url);
    const res = await fetch(url);
    const json = await res.json();

    // 데이터 API는 응답 구조가 조금 다릅니다. (response.result.featureCollection.features)
    if (json.response.status === "NOT_FOUND") {
         return NextResponse.json({ features: [] }); // 빈 땅
    }
    
    if (json.response.status !== "OK") {
        console.error("VWorld Error:", json.response);
        return NextResponse.json({ error: json.response.error }, { status: 500 });
    }

    // WFS와 똑같은 GeoJSON 구조로 맞춰서 리턴
    return NextResponse.json(json.response.result.featureCollection);

  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch land data" }, { status: 500 });
  }
}