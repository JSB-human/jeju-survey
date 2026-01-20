import { NextResponse } from "next/server";

const TMAP_PREDICTION_URL = process.env.TMAP_PREDICTION_URL;
const TMAP_APP_KEY = process.env.TMAP_APP_KEY;

export async function POST(request: Request) {
  if (!TMAP_APP_KEY || !TMAP_PREDICTION_URL) {
    return NextResponse.json(
      { error: "TMAP_APP_KEY or TMAP_PREDICTION_URL is missing" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const query = body?.query ?? {};
  const url = new URL(TMAP_PREDICTION_URL);
  url.searchParams.set("version", query.version ?? "1");
  url.searchParams.set("reqCoordType", query.reqCoordType ?? "WGS84GEO");
  url.searchParams.set("resCoordType", query.resCoordType ?? "WGS84GEO");
  url.searchParams.set("sort", query.sort ?? "index");
  if (query.totalValue) {
    url.searchParams.set("totalValue", String(query.totalValue));
  }
  if (query.tollgateFareInfo) {
    url.searchParams.set("tollgateFareInfo", String(query.tollgateFareInfo));
  }
  if (query.trafficInfo) {
    url.searchParams.set("trafficInfo", String(query.trafficInfo));
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      appKey: TMAP_APP_KEY,
    },
    body: JSON.stringify({ routesInfo: body?.routesInfo }),
  });

  const text = await response.text();
  if (!response.ok) {
    return NextResponse.json(
      { error: "TMAP request failed", details: text },
      { status: response.status }
    );
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
