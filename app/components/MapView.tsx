"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { ColumnLayer, PathLayer, ScatterplotLayer, TextLayer, GeoJsonLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";

import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathStyleExtension } from "@deck.gl/extensions";


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
  useMobileLock?: boolean;
  onGeometryChange?: (area: number, boundary: number[][]) => void;
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
  isEditable,
  useMobileLock,
  onGeometryChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<maplibregl.Map | null>(null);
  const deckOverlayRef = useRef<InstanceType<typeof MapboxOverlay> | null>(null);
  const [routeGeoJson, setRouteGeoJson] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [isRequestingRoute, setIsRequestingRoute] = useState(false);
  const [startPoint, setStartPoint] = useState<MapData["coordinates"] | null>(
     null
  );
  const [endPoint, setEndPoint] = useState<MapData["coordinates"] | null>(
     null
  );
  const [isPicking, setIsPicking] = useState<"start" | "end" | null>(null);
  const [mapMode, setMapMode] = useState<"satellite" | "standard">("satellite");
  const [isRouteControlsOpen, setIsRouteControlsOpen] = useState(false);


  // 선택된 땅(필지) 데이터 저장용
  const [selectedLand, setSelectedLand] = useState<any>(null);
  const [isLandLoading, setIsLandLoading] = useState(false);


  // 네비게이션 경로 애니메이션 시간
  const [time, setTime] = useState(0);
  const animationFrame = useRef<number>(0);

  const handleMapClick = async (info: any) => {
    // 나무나 마커를 클릭했을 땐 실행 X (땅을 클릭했을 때만)
    if (info.object) return; 

    const { coordinate } = info;
    if (!coordinate) return;

    setIsLandLoading(true);
    try {
      // 위에서 만든 백엔드 API 호출
      const res = await fetch(`/api/land?lng=${coordinate[0]}&lat=${coordinate[1]}`);
      const geoJson = await res.json();

      if (geoJson.features && geoJson.features.length > 0) {
        // 가장 첫 번째 필지 선택
        setSelectedLand(geoJson.features[0]);
      } else {
        setSelectedLand(null); // 빈 땅 클릭 시 선택 해제
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLandLoading(false);
    }
  };


  useEffect(() => {
    const animate = () => {
      setTime((t) => (t + 1) % 100); 
      animationFrame.current = requestAnimationFrame(animate);
    };
    animationFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame.current);
  }, []);

  const routeSummary = useMemo(() => {
    if (!routeGeoJson?.features?.length) return null;
    const summaryFeature = routeGeoJson.features.find(
      (feature) =>
        feature.geometry?.type === "Point" &&
        (feature.properties as { pointType?: string })?.pointType === "S"
    );
    return summaryFeature?.properties ?? null;
  }, [routeGeoJson]);

  const tripsData = useMemo(() => {
    if (!routeGeoJson?.features) return [];

    return routeGeoJson.features
      .filter((f: any) => f.geometry.type === "LineString")
      .map((f: any) => {
        const coords = f.geometry.coordinates;
        // 경로의 시작(0)부터 끝(100)까지 시간을 순차적으로 매핑
        return {
          path: coords,
          timestamps: coords.map((_: any, i: number) => (i / (coords.length - 1)) * 100),
        };
      });
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

        // 3D 나무 레이어
        new (ScenegraphLayer as any)({
          id: "farmland-trees",
          data,
          pickable: true,
          scenegraph: "/models/orange_tree.glb",
          
          getPosition: (d: any) => [
            d.coordinates.lng, 
            d.coordinates.lat, 
            // 나무 높이보다 살짝 높게 설정 (예: 20미터 위)
            // 나무 모델 사이즈(sizeScale)가 20이라면 그보다 조금 더 높게 잡으세요.
            25 
          ],
          getOrientation: (d: MapData) => [0, Math.random() * 360, 90],
          sizeScale: 20, 
          _lighting: "pbr",
          
          getScale: (d: MapData) => d.id === selectedId ? [1.5, 1.5, 1.5] : [1, 1, 1],
   
          onClick: (info: { object?: MapData }) => {
            if (info.object && onFeatureClick) onFeatureClick(info.object.id);
          },
        }),

        new TextLayer({
          id: "info-labels",
          data,
          pickable: true,
          // 나무 위치와 동일하게 잡음
          getPosition: (d: MapData) => [d.coordinates.lng, d.coordinates.lat],
          
          // 📝 표시할 텍스트 (지명 + 나무 본수)
          getText: (d: MapData) => {
            // 데이터에 treeCount가 없으면 임의로 50~100 사이 숫자로 가정
            const treeCount = d.treeCount || Math.floor(Math.random() * 50) + 50; 
            // 줄바꿈(\n)을 써서 두 줄로 표시
            return `${d.address || '알 수 없는 곳'}\n🌲 ${treeCount}본`;
          },
          
          // 스타일링
          getSize: 14,
          getColor: [255, 255, 255], // 흰색 글씨
          
          // 🚀 위치 조정 (나무 꼭대기 위로 띄우기)
          getPixelOffset: [0, 50], // Y축으로 -50픽셀 위로 올림
          
          // 배경 박스 (가독성 UP)
          background: true,
          getBackgroundColor: [0, 0, 0, 160], // 반투명 검은색 (R, G, B, Alpha)
          backgroundPadding: [8, 4], // 여백 [가로, 세로]
          
          // 폰트 설정
          fontFamily: '"Pretendard", "Malgun Gothic", sans-serif',
          fontWeight: 700,
          
          // ⭐ 중요: 한글 깨짐 방지
          characterSet: "auto", 
          
          // 빌보드 효과 (지도를 돌려도 글자는 항상 정면을 봄)
          billboard: true,
          
          // 겹침 방지 (선택 사항: 글자가 너무 많으면 켜세요)
          // collisionEnabled: true, 
        }),
      ];

      if (selectedLand) {
        layers.push(
          new GeoJsonLayer({
            id: "selected-land-polygon",
            data: selectedLand,
            pickable: true,
            stroked: true,
            filled: true,
            extruded: false,
            
            // 🚀 [수정 포인트 1] 면 색상: 보라색 대신 '아주 희미한 청록색'
            // 투명도(맨 뒤 숫자)를 20~30 정도로 아주 낮춰서, 
            // 땅의 위성 사진이 그대로 비치면서 살짝 '선택된 느낌'만 줍니다.
            getFillColor: mapMode === "standard" ? [0, 219, 127, 20] : [245, 219, 127, 20], 

            // 🚀 [수정 포인트 2] 선 색상: '완전한 형광 Cyan'
            // 알파값을 255로 꽉 채워서 빛나는 느낌을 줍니다.
            getLineColor: mapMode === "standard" ? [0, 219, 127, 255] : [245, 219, 127, 255], 

            // 🚀 [수정 포인트 3] 두께: 얇고 예리하게
            // 굵으면 촌스럽습니다. 2~3픽셀로 얇게 그리는 게 훨씬 세련됩니다.
            getLineWidth: 2,
            lineWidthMinPixels: 2,
            
            // 🚀 [수정 포인트 4] 점선 제거 & 부드러운 마감
            // 점선(dash) 확장을 빼버리고, 모서리를 둥글게 처리합니다.
            lineJointRounded: true,
            lineCapRounded: true,

            // ✨ [꿀팁] 지형이랑 겹쳐서 깜빡거리는 현상(Z-fighting) 방지
            // 폴리곤을 카메라 쪽으로 아주 살짝 띄웁니다.
            parameters: {
              depthTest: false, // 혹은 getPolygonOffset 사용
            },
             // 만약 depthTest: false가 너무 떠 보이면 아래 옵션 사용
            getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -layerIndex * 100],
          })
        );
      }

      if (tripsData.length > 0) {
      
        // (A) 베이스 라인: 희미한 전선 (길이 어디 있는지 알려줌)
        layers.push(
          new PathLayer({
            id: "route-base",
            data: routeGeoJson?.features.filter((f: any) => f.geometry.type === "LineString"),
            getPath: (d: any) => d.geometry.coordinates,
            getColor: [245, 73, 39], 
            getWidth: 10,
            widthMinPixels: 2, 
            capRounded: true,
            jointRounded: true,
          } as any)
        );
  
        // (B) 에너지 흐름: 빛나는 네온 펄스
        layers.push(
          new (TripsLayer as any)({
            id: "route-pulse",
            data: tripsData,
            getPath: (d: any) => d.path,
            getTimestamps: (d: any) => d.timestamps,
            getColor: [0, 0, 0], 
            opacity: 1,
            widthMinPixels: 5, // 베이스보다 살짝 얇게 해서 가운데가 빛나는 느낌
            rounded: true,
            
            // ✨ 꼬리 길이 (길수록 스피디해 보임)
            trailLength: 30, 
            
            currentTime: time,
            shadowEnabled: false,
            
            // ✨ 빛나는 효과의 핵심 (Additive Blending)
            // 배경이 어두울수록 빛이 더 강렬하게 보입니다.
            parameters: {
              blend: true,
              blendFunc: ["ONE", "ONE"], // WebGL Additive Blending 상수
            }
          } as any)
        );
      }



      // 경로 레이어 (PathLayer)
      // if (routePathData.length > 0) {
      //   layers.push(
      //     new PathLayer({
      //       id: "route-path",
      //       data: routePathData,
      //       getPath: (d: any) => d.path,
      //       getColor: [255, 107, 0, 200], // 오렌지 네온
      //       getWidth: 10,
      //       widthMinPixels: 4,
      //       capRounded: true,
      //       jointRounded: true,
      //       pickable: true,
      //     })
      //   );
      // }

      // 출발/도착 마커 (IconLayer) - 핀 모양
      const pointsData = [];
      if (startPoint) pointsData.push({ position: [startPoint.lng, startPoint.lat], type: "start", label: "출발" });
      if (endPoint) pointsData.push({ position: [endPoint.lng, endPoint.lat], type: "end", label: "도착" });

      if (pointsData.length > 0) {

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
    [data, selectedId, onFeatureClick, tripsData, time, routeGeoJson, startPoint, endPoint, routeSummary]
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
      cooperativeGestures: useMobileLock, // 모바일 제스처 잠금 (두 손가락 스크롤)
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
    const deckOverlay = new MapboxOverlay({ layers: deckLayers, onClick: handleMapClick, });
    map.addControl(deckOverlay as any);
    deckOverlayRef.current = deckOverlay;
    mapObjRef.current = map;

    // map.once("load", () => {
    //   map.resize();
      
    //   // 🚀 지형 데이터: 브이월드 대신 안정적인 글로벌 무료 소스 사용 (에러 방지)
    //   map.addSource("global-terrain", {
    //     type: "raster-dem",
    //     tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
    //     encoding: "terrarium", // 표준 인코딩
    //     tileSize: 256,
    //     maxzoom: 15
    //   });
    
    //   map.setTerrain({ source: "global-terrain", exaggeration: 1.5 });
    // });

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


      {/* 선택된 땅(필지) 정보 표시 */}
      {selectedLand && (
        <div className="absolute top-20 left-4 z-30 w-64 animate-in slide-in-from-left duration-300">
          <div className="bg-black/80 backdrop-blur-md border border-slate-600 p-4 rounded-2xl shadow-2xl text-white">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-bold text-emerald-400">{selectedLand.properties.addr}</h3>
              <button 
                onClick={() => setSelectedLand(null)}
                className="text-slate-400 hover:text-white"
              >✕</button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-slate-400">지번</span>
                <span className="font-bold">{selectedLand.properties.jibun}</span>
              </div>
              {/* <div className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-slate-400">지목</span>
                <span className="font-bold">{selectedLand.properties.jimok}</span>
              </div> */}
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span className="text-slate-400">기준년월</span>
                <span className="font-bold text-orange-400">
                  {/* 브이월드 데이터에 면적이 있다면 표시, 없으면 계산 */}
                  {selectedLand.properties.pnu ? selectedLand.properties.gosi_year + "년 " + selectedLand.properties.gosi_month + "월" : "-"} 
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                PNU: {selectedLand.properties.pnu}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 로딩 인디케이터 */}
      {isLandLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default MapView;