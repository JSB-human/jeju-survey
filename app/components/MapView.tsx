"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { ColumnLayer, PathLayer, ScatterplotLayer, TextLayer, IconLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_KEY;

interface MapData {
  id: string;
  coordinates: { lat: number; lng: number };
  boundary?: number[][];
  area?: number;
  status?: string;
  type?: string;
  [key: string]: any;
}

interface MapViewProps {
  data: MapData[];
  selectedId: string | null;
  className?: string;
  isEditable?: boolean;
  onFeatureClick?: (id: string) => void;
}

const DEFAULT_CENTER: [number, number] = [126.5000, 33.3500]; // 제주도 중앙

const getElevation = (item: MapData) => {
  if (typeof item.area === "number") return Math.max(item.area / 10, 50);
  if (item.boundary?.length) return Math.max(item.boundary.length * 10, 50);
  return 80;
};

const MapView: React.FC<MapViewProps> = ({
  data,
  selectedId,
  className,
  onFeatureClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<maplibregl.Map | null>(null);
  const deckOverlayRef = useRef<InstanceType<typeof MapboxOverlay> | null>(null);
  const [routeGeoJson, setRouteGeoJson] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [isRequestingRoute, setIsRequestingRoute] = useState(false);
  const [startPoint, setStartPoint] = useState<MapData["coordinates"] | null>(
    data[0]?.coordinates ?? null
  );
  const [endPoint, setEndPoint] = useState<MapData["coordinates"] | null>(
    data[1]?.coordinates ?? null
  );
  const [isPicking, setIsPicking] = useState<"start" | "end" | null>(null);
  const [mapMode, setMapMode] = useState<"satellite" | "standard">("satellite");
  const [isRouteControlsOpen, setIsRouteControlsOpen] = useState(false);

  const routeSummary = useMemo(() => {
    if (!routeGeoJson?.features?.length) return null;
    const summaryFeature = routeGeoJson.features.find(
      (feature) =>
        feature.geometry?.type === "Point" &&
        (feature.properties as { pointType?: string })?.pointType === "S"
    );
    return summaryFeature?.properties ?? null;
  }, [routeGeoJson]);

  // 경로 데이터 전처리: LineString만 추출하여 PathLayer용 데이터로 변환
  const routePathData = useMemo(() => {
    if (!routeGeoJson?.features) return [];
    return routeGeoJson.features
      .filter((f) => f.geometry.type === "LineString")
      .map((f) => ({
        path: (f.geometry as GeoJSON.LineString).coordinates,
        properties: f.properties,
      }));
  }, [routeGeoJson]);

  useEffect(() => {
    // 초기 로드 시에만 기본값 설정, 이후 초기화 시에는 재설정되지 않도록 함
    if (data[0]?.coordinates && startPoint === undefined) {
      setStartPoint(data[0].coordinates);
    }
    if (data[1]?.coordinates && endPoint === undefined) {
      setEndPoint(data[1].coordinates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Deck.gl 레이어 구성
  const deckLayers = useMemo(
    () => {
      const layers: any[] = [
        new ColumnLayer({
          id: "farmland-column",
          data,
          getPosition: (d: MapData) => [d.coordinates.lng, d.coordinates.lat],
          getFillColor: (d: MapData) =>
            d.id === selectedId ? [255, 107, 0, 230] : [0, 230, 118, 150],
          getElevation,
          radius: 25,
          extruded: true,
          pickable: true,
          elevationScale: 1,
          material: {
            ambient: 0.3,
            diffuse: 0.7,
            shininess: 32,
          },
          transitions: {
            getElevation: 600,
            getFillColor: 600,
          },
          onClick: (info: { object?: MapData }) => {
            if (info.object && onFeatureClick) onFeatureClick(info.object.id);
          },
        }),
      ];

      // 경로 레이어 (PathLayer)
      if (routePathData.length > 0) {
        layers.push(
          new PathLayer({
            id: "route-path",
            data: routePathData,
            getPath: (d: any) => d.path,
            getColor: [255, 107, 0, 200], // 오렌지 네온
            getWidth: 10,
            widthMinPixels: 4,
            capRounded: true,
            jointRounded: true,
            pickable: true,
          })
        );
      }

      // 출발/도착 마커 (IconLayer) - 핀 모양
      const pointsData = [];
      if (startPoint) pointsData.push({ position: [startPoint.lng, startPoint.lat], type: "start", label: "출발" });
      if (endPoint) pointsData.push({ position: [endPoint.lng, endPoint.lat], type: "end", label: "도착" });

      if (pointsData.length > 0) {
        // 핀 아이콘 SVG
        const pinIconMapping = {
          marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
        };
        
        // 간단한 핀 모양 (채워진 원 + 꼬리)
        const pinSvg = `https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png`; // 예시용, 실제로는 SVG path나 이미지 URL 사용 권장

        layers.push(
          new ScatterplotLayer({
            id: "route-points-base",
            data: pointsData,
            getPosition: (d: any) => d.position,
            getFillColor: (d: any) => d.type === "start" ? [34, 197, 94] : [239, 68, 68],
            getRadius: 8,
            radiusMinPixels: 8,
            stroked: true,
            getLineColor: [255, 255, 255],
            getLineWidth: 2,
          }),
          new TextLayer({
            id: "route-labels",
            data: pointsData,
            getPosition: (d: any) => d.position,
            getText: (d: any) => d.label,
            getSize: 14,
            getColor: [255, 255, 255],
            getPixelOffset: [0, -28],
            background: true,
            getBackgroundColor: (d: any) => d.type === "start" ? [34, 197, 94, 200] : [239, 68, 68, 200],
            backgroundPadding: [8, 4],
            billboard: true,
            fontFamily: '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
            fontWeight: 700,
            characterSet: "auto",
            
          })
        );
      }

      // 거리/시간 정보 텍스트 (도착지 위에 표시)
      if (routeSummary && endPoint) {
        const totalDistKm = (routeSummary.totalDistance / 1000).toFixed(1);
        const totalTimeMin = Math.round(routeSummary.totalTime / 60);
        
        layers.push(
          new TextLayer({
            id: "route-info-text",
            data: [{ position: [endPoint.lng, endPoint.lat], text: `${totalDistKm}km | ${totalTimeMin}분` }],
            getPosition: (d: any) => d.position,
            getText: (d: any) => d.text,
            getSize: 20,
            getColor: [255, 255, 255],
            getPixelOffset: [0, -60], // 라벨 위로 띄움
            background: true,
            getBackgroundColor: [0, 0, 0, 200],
            backgroundPadding: [8, 4],
            fontFamily: '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
            fontWeight: 800,
            characterSet: "auto",
          })
        );
      }

      return layers;
    },
    [data, selectedId, onFeatureClick, routePathData, startPoint, endPoint, routeSummary]
  );

  // 2. MapLibre 스타일: VWorld + 테슬라 감성 옵션
  const mapStyle = useMemo<maplibregl.StyleSpecification>(() => {
    if (!VWORLD_API_KEY) {
      return {
        version: 8,
        sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256 } },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      } as any;
    }

    return {
      version: 8,
      sources: {
        vworldBase: {
          type: "raster",
          tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`],
          tileSize: 256,
          maxzoom: 18,
        },
        vworldSatellite: {
          type: "raster",
          tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Satellite/{z}/{y}/{x}.jpeg`],
          tileSize: 256,
          maxzoom: 18,
        },
        vworldHybrid: {
          type: "raster",
          tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Hybrid/{z}/{y}/{x}.png`],
          tileSize: 256,
          maxzoom: 18,
        }
      },
      layers: [
        mapMode === "standard"
          ? {
              id: "base",
              type: "raster",
              source: "vworldBase",
            }
          : {
              id: "satellite",
              type: "raster",
              source: "vworldSatellite",
              paint: {
                // "raster-brightness-max": 0.5, 
              }
            },
        mapMode === "satellite" && {
          id: "hybrid",
          type: "raster",
          source: "vworldHybrid",
        }
      ].filter(Boolean) as maplibregl.LayerSpecification[],
    };
  }, [mapMode]);

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;

    const center = data[0]?.coordinates
      ? ([data[0].coordinates.lng, data[0].coordinates.lat] as [number, number])
      : DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
      center,
      zoom: 16,
      maxZoom: 22,
      pitch: 65,   // 테슬라 뷰포트 각도
      bearing: -15,
      // antialias: true, // 3D 객체 계단현상 방지 (고사양)
      attributionControl: false,
      // 🚀 500 에러 및 InvalidStateError 원천 차단 로직
      transformRequest: (url, resourceType) => {
        if (resourceType === "Tile" && url.includes("vworld.kr")) {
          const parts = url.split("/");
          // 'dem', 'Satellite', 'Base', 'Hybrid' 키워드 뒤의 숫자가 줌 레벨
          const typeIndex = parts.findIndex(p => ["dem", "Satellite", "Base", "Hybrid"].includes(p));
          if (typeIndex !== -1) {
            const z = parseInt(parts[typeIndex + 1]);
            if (z > 18) {
              parts[typeIndex + 1] = "18"; // 데이터를 18로 고정하여 서버 404/500 방지
              return { url: parts.join("/") };
            }
          }
        }
        return { url };
      }
    });

    // 3. Deck.gl 오버레이 연결
    const deckOverlay = new MapboxOverlay({ layers: deckLayers });
    map.addControl(deckOverlay as any);
    deckOverlayRef.current = deckOverlay;
    mapObjRef.current = map;

    map.once("load", () => {
      map.resize();
      
      // 🚀 지형 데이터: 브이월드 대신 안정적인 글로벌 무료 소스 사용 (에러 방지)
      map.addSource("global-terrain", {
        type: "raster-dem",
        tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
        encoding: "terrarium", // 표준 인코딩
        tileSize: 256,
        maxzoom: 15
      });
    
      map.setTerrain({ source: "global-terrain", exaggeration: 1.5 });
    });

    return () => {
      map.remove();
      mapObjRef.current = null;
    };
  }, []); // 마운트 시 한 번만 실행 (스타일 변경은 setStyle로 처리)

  // 스타일 동적 변경
  useEffect(() => {
    if (mapObjRef.current) {
      mapObjRef.current.setStyle(mapStyle);
    }
  }, [mapStyle]);

  // 데이터 변경 시 deck.gl 레이어 동기화
  useEffect(() => {
    if (deckOverlayRef.current) {
      deckOverlayRef.current.setProps({ layers: deckLayers });
    }
  }, [deckLayers]);

  useEffect(() => {
    if (!mapObjRef.current) return;
    const map = mapObjRef.current;
    const handleClick = (event: maplibregl.MapMouseEvent) => {
      if (!isPicking) return;
      const { lng, lat } = event.lngLat;
      if (isPicking === "start") {
        setStartPoint({ lng, lat });
      } else {
        setEndPoint({ lng, lat });
      }
      setIsPicking(null);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [isPicking]);

  const formatPredictionTime = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");
    const tzOffset = -date.getTimezoneOffset();
    const sign = tzOffset >= 0 ? "+" : "-";
    const hours = pad(Math.floor(Math.abs(tzOffset) / 60));
    const minutes = pad(Math.abs(tzOffset) % 60);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}${sign}${hours}${minutes}`;
  };

  const requestRoutePrediction = async () => {
    if (isRequestingRoute) return;
    if (!startPoint || !endPoint) {
      alert("출발/도착 지점이 최소 2개 필요합니다.");
      return;
    }

    setIsRequestingRoute(true);
    try {
      const response = await fetch("/api/tmap/route-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routesInfo: {
            departure: {
              name: "출발",
              lon: String(startPoint.lng),
              lat: String(startPoint.lat),
              depSearchFlag: "03",
            },
            destination: {
              name: "도착",
              lon: String(endPoint.lng),
              lat: String(endPoint.lat),
              destSearchFlag: "03",
            },
            predictionType: "departure",
            predictionTime: formatPredictionTime(new Date()),
            searchOption: "00",
            tollgateCarType: "car",
          },
          query: {
            version: "1",
            reqCoordType: "WGS84GEO",
            resCoordType: "WGS84GEO",
            sort: "index",
            trafficInfo: "N",
          },
        }),
      });
      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      if (!response.ok) {
        const detail =
          payload?.error || payload?.details || "TMAP 예측 경로 요청 실패";
        throw new Error(detail);
      }
      const geoJson =
        payload?.features?.length ? payload : payload?.geojson ?? null;
      if (geoJson) {
        setRouteGeoJson(geoJson);
      } else {
        console.error("TMAP 응답에서 경로 데이터를 찾지 못했습니다.", payload);
        alert("경로 데이터를 찾지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("TMAP 예측 경로 요청 중 오류가 발생했습니다.");
    } finally {
      setIsRequestingRoute(false);
    }
  };

  return (
    <div className={`group relative overflow-hidden bg-white ${className ?? ""}`}>
      {/* 테슬라 스타일 비네팅 오버레이 (선택 사항) */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.2)]" />
      <div ref={mapRef} className="w-full h-full" />

      {/* 상단 우측 지도 모드 토글 (플로팅) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        <button
          type="button"
          onClick={() => setMapMode(prev => prev === "satellite" ? "standard" : "satellite")}
          className="px-3 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-700 shadow-lg hover:bg-white transition-all whitespace-nowrap flex items-center gap-2"
        >
          {mapMode === "satellite" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              일반지도 보기
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              위성지도 보기
            </>
          )}
        </button>

        {/* 경로 예측 도구 토글 버튼 */}
        <button
          type="button"
          onClick={() => setIsRouteControlsOpen(!isRouteControlsOpen)}
          className={`px-3 py-2 rounded-xl backdrop-blur-md border text-xs font-bold shadow-lg transition-all whitespace-nowrap flex items-center gap-2 ${
            isRouteControlsOpen 
              ? "bg-orange-500 border-orange-600 text-white"
              : "bg-white/90 border-slate-200 text-slate-700 hover:bg-white"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isRouteControlsOpen ? "bg-white" : "bg-orange-500"}`} />
          {isRouteControlsOpen ? "경로 도구 닫기" : "경로 예측 도구"}
        </button>
      </div>

      {/* 안내 메시지 (픽킹 모드일 때) */}
      {isPicking && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <div className="bg-[#37352f] text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm">
            지도에서 {isPicking === "start" ? "출발지" : "도착지"}를 클릭하세요
          </div>
        </div>
      )}

      {/* 하단 컨트롤 바 (토글됨) */}
      {isRouteControlsOpen && (
        <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:right-auto z-20 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col md:flex-row items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPicking("start")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  isPicking === "start"
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                    : "bg-slate-100 text-[#37352f] hover:bg-slate-200"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                출발
              </button>
              <button
                type="button"
                onClick={() => setIsPicking("end")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  isPicking === "end"
                    ? "bg-rose-600 text-white ring-2 ring-rose-400"
                    : "bg-slate-100 text-[#37352f] hover:bg-slate-200"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                도착
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={requestRoutePrediction}
                disabled={isRequestingRoute || !startPoint || !endPoint}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-orange-600 text-xs font-bold text-white shadow-md hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 whitespace-nowrap"
              >
                {isRequestingRoute ? "계산 중..." : "경로 예측"}
              </button>
              
              {routeGeoJson && (
                <button
                  type="button"
                  onClick={() => {
                    setRouteGeoJson(null);
                    setStartPoint(null);
                    setEndPoint(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-[#9b9a97] hover:bg-slate-200 hover:text-[#37352f] transition-all whitespace-nowrap"
                >
                  지우기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;