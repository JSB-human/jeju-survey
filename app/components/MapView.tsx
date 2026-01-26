"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { ColumnLayer, PathLayer, ScatterplotLayer, TextLayer, GeoJsonLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";
import { Maximize2, Minimize2, Layers, Map as MapIcon, Navigation, Menu, X } from "lucide-react";

import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import { TripsLayer } from "@deck.gl/geo-layers";


import { load } from "@loaders.gl/core";
import { GLTFLoader } from "@loaders.gl/gltf";
import { DracoLoader } from "@loaders.gl/draco";

// Three.js 관련 임포트
import * as THREE from "three";
// @ts-ignore
import { GLTFLoader as ThreeGLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const STATIC_MODEL_URL = "/models/tng_farmer.glb"; // 원래는 뼈 없는 파일 권장

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_KEY;



const FARMER_ANIM_SETTINGS = {
  // 1. 와일드카드: 파일 내의 첫 번째 애니메이션 실행
  '*': { speed: 1, playing: true },
  
  // 2. 구체적 이름: 콘솔에서 확인한 이름 지정 (우선순위 높음)
  // 'wave': { speed: 1, playing: true }
};

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // FAB 메뉴 상태
  const [isFabOpen, setIsFabOpen] = useState(false);
  // 나무 투명도 상태 (0~1)
  const [treeOpacity, setTreeOpacity] = useState(1.0);


  // 선택된 땅(필지) 데이터 저장용
  const [selectedLand, setSelectedLand] = useState<any>(null);
  const [isLandLoading, setIsLandLoading] = useState(false);


  // 네비게이션 경로 애니메이션 시간
  const [tripsTime, setTripsTime] = useState(0);
  const [timer, setTimer] = useState(0); 

  // 경로 데이터 존재 여부 추적 (불필요한 리렌더링 방지)
  const hasRouteRef = useRef(false);
  
  // 상태가 바뀔 때마다 Ref도 최신화

  useEffect(() => {
    hasRouteRef.current = !!(routeGeoJson?.features?.length);
  }, [routeGeoJson]);

  

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      // 1. 경로 애니메이션 (데이터가 있을 때만 React State 업데이트)
      if (hasRouteRef.current) {
         setTripsTime((prev) => (prev + 0.5) % 100); 
      }

      setTimer((prev) => prev + 0.05);

      // 2. MapLibre 강제 리페인트 (애니메이션 끊김 방지)
      if (mapObjRef.current) {
        if (mapObjRef.current.isStyleLoaded()) {
           mapObjRef.current.triggerRepaint();
        }
      }

      // 3. Deck.gl 강제 redraw (ScenegraphLayer 내부 애니메이션용)
      if (deckOverlayRef.current) {
         (deckOverlayRef.current as any)._deck?.redraw("animation-sync");
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    
    // 애니메이션 시작 전 약간의 지연
    const timeoutId = setTimeout(() => {
        animate();
    }, 100);

    return () => {
        clearTimeout(timeoutId);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);


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
    // 초기 로드 시에만 기본값 설정 (데이터가 있고, 포인트가 설정되지 않았을 때)
    if (data[0]?.coordinates && !startPoint) {
      setStartPoint(data[0].coordinates);
    }
    if (data[1]?.coordinates && !endPoint) {
      setEndPoint(data[1].coordinates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Deck.gl 레이어 구성
  const staticLayers = useMemo(() => {
    if (!data || data.length === 0) return [];

    const layers: any[] = [];
    const farmerData = [data[0]];
    const treeData = data.slice(1);

    // 1. 나무 레이어
    layers.push(
      new (ScenegraphLayer as any)({
        id: "farmland-trees",
        data: treeData,
        pickable: true,
        scenegraph: "/models/orange_tree.glb",
        getPosition: (d: any) => [d.coordinates.lng, d.coordinates.lat, 25],
        getOrientation: (d: any) => [0, (d.coordinates.lng * 123456) % 360, 90],
        sizeScale: 20,
        _lighting: "pbr",
        opacity: treeOpacity,
        getScale: (d: MapData) => d.id === selectedId ? [1.5, 1.5, 1.5] : [1, 1, 1],
        onClick: (info: { object?: MapData }) => {
          if (info.object && onFeatureClick) onFeatureClick(info.object.id);
        },
      })
    );

    // 2. 텍스트 레이어
    // layers.push(
    //   new TextLayer({
    //     id: "info-labels",
    //     data,
    //     pickable: true,
    //     getPosition: (d: MapData) => [d.coordinates.lng, d.coordinates.lat],
    //     getText: (d: MapData) => {
    //       const treeCount = d.treeCount || Math.floor(Math.random() * 50) + 50;
    //       return `${d.address || '알 수 없는 곳'}\n🌲 ${treeCount}본`;
    //     },
    //     getSize: 14,
    //     getColor: [255, 255, 255],
    //     getPixelOffset: [0, 50],
    //     background: true,
    //     getBackgroundColor: [0, 0, 0, 160],
    //     backgroundPadding: [8, 4],
    //     fontFamily: '"Pretendard", "Malgun Gothic", sans-serif',
    //     fontWeight: 700,
    //     characterSet: "auto",
    //     billboard: true,
    //   })
    // );


    // 3. 👨‍🌾 농부 레이어 (안전 모드: 일단 보이게 하기)
    // if (farmerData.length > 0) {
    //   layers.push(
    //     new ScatterplotLayer({
    //       id: "farmer-hitbox",
    //       data: farmerData,
    //       pickable: true, // 🚨 얘는 마우스 감지 켜기
    //       opacity: 0,     // 🚨 눈에는 안 보임 (투명)
    //       radiusScale: 1,
    //       radiusMinPixels: 20, // 마우스 대기 편하게 넉넉한 크기
    //       getPosition: (d: any) => [d.coordinates.lng, d.coordinates.lat],
    //       getFillColor: [0, 0, 0],
          
    //       // 호버 이벤트는 여기서 처리!
    //       onHover: (info: any) => {
    //         if (info.object) {
    //           setHoveredInfo({
    //             id: info.object.id,
    //             coords: [info.object.coordinates.lng, info.object.coordinates.lat]
    //           });
    //         } else {
    //           setHoveredInfo(null);
    //         }
    //       }
    //     })
    //   );
    // }

    // 3-2. 👨‍🌾 농부 레이어 (보여주기용)
    // 얘는 마우스 감지를 끄고, 히트박스의 신호에 따라 숨기만 합니다.
    if (farmerData.length > 0) {
      layers.push(
        new ScenegraphLayer({
          id: "static-farmers",
          data: farmerData,
          scenegraph: STATIC_MODEL_URL,
          
          loaders: [GLTFLoader],
          loadOptions: { gltf: { postProcess: true } },
    
          pickable: true, // 🚨 중요: 얘는 마우스 감지 끄기 (무한루프 방지)
          sizeScale: 60,
          
          getPosition: (d: any) => [d.coordinates.lng, d.coordinates.lat],
          getOrientation: [0, 0, 90],
          _lighting: "pbr",

          onClick: (info: { object?: MapData }) => {
            if (info.object) {
              alert('');
              // 여기에 원하는 로직(모달 열기 등)을 넣으세요.
            }
          },
        }),

        new TextLayer({
          id: "quest-mark",
          data: farmerData, 
          pickable: true,
          
          // 🚨 [포인트] tripsTime(0~100)을 활용하여 높이(Z)에 애니메이션 적용
          // Math.sin을 사용하면 아주 부드러운 상하 운동을 합니다.
          getPosition: (d: any) => [
            d.coordinates.lng, 
            d.coordinates.lat, 
            120 + (Math.sin(timer) * 10)
          ], 
          
          getText: (d: any) => "!", 
          
          // 기준점 설정 (중앙 하단)
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          
          // 폰트 스타일 (와우 느낌 극대화)
          getSize: 50,
          getColor: [255, 215, 0], // 황금색
          fontFamily: '"Arial Black", "Impact", sans-serif',
          fontWeight: 900,
          outlineWidth: 5, // 테두리를 더 두껍게 해서 가독성 확보
          outlineColor: [40, 20, 0], // 진한 갈색/검정 테두리
          
          billboard: true, 
          
          updateTriggers: {
            getPosition: [timer]
          }
        }),
      );
    }

    // 4. 선택된 땅 (GeoJson)
    if (selectedLand) {
         layers.push(
            new GeoJsonLayer({
                id: "selected-land-polygon",
                data: selectedLand,
                pickable: true,
                stroked: true,
                filled: true,
                extruded: false,
                getFillColor: mapMode === "standard" ? [0, 219, 127, 20] : [245, 219, 127, 20], 
                getLineColor: mapMode === "standard" ? [0, 219, 127, 255] : [245, 219, 127, 255], 
                getLineWidth: 2,
                lineWidthMinPixels: 2,
                lineJointRounded: true,
                lineCapRounded: true,
                parameters: { depthTest: false },
                getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -layerIndex * 100],
              })
        )
    }

    return layers;
  }, [data, selectedId, onFeatureClick, treeOpacity, selectedLand, mapMode, tripsTime, routeGeoJson, tripsData, timer]);


  // ⚡ [Step 2] 동적 레이어 (time에 따라 계속 변하는 애들: 경로 애니메이션)
  const animatedLayers = useMemo(() => {
    const layers: any[] = [];

    if (tripsData.length > 0) {
        // 배경 라인
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

        // 움직이는 펄스 (TripsLayer)
        layers.push(
            new (TripsLayer as any)({
                id: "route-pulse",
                data: tripsData,
                getPath: (d: any) => d.path,
                getTimestamps: (d: any) => d.timestamps,
                getColor: [0, 0, 0], 
                opacity: 1,
                widthMinPixels: 5,
                rounded: true,
                trailLength: 30, 
                currentTime: tripsTime, // 👈 얘는 time이 필요함!
                shadowEnabled: false,
                parameters: {
                  blend: true,
                  blendFunc: ["ONE", "ONE"],
                }
              } as any)
        );
    }
    
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
  }, [routeGeoJson, tripsData, tripsTime, startPoint, endPoint, routePathData, routeSummary]); 


  // 🔗 [Step 3] 최종 합체
  const deckLayers = useMemo(() => {
      return [...staticLayers, ...animatedLayers];
  }, [staticLayers, animatedLayers]);

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
    const deckOverlay = new MapboxOverlay({
      layers: deckLayers,
      onClick: handleMapClick,
    });
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
        // 스타일이 로드되지 않았거나, 업데이트 중일 땐 건너뜀
        if (!mapObjRef.current.isStyleLoaded()) return;
        
        try {
            // 단순 객체 비교는 어려우므로, mapMode가 바뀔 때만 실행되도록 로직 위임 (deps에 mapStyle이 있으므로)
            // 하지만 mapStyle이 계속 새 객체로 생성되므로, 여기서는 최대한 에러를 무시하고 넘깁니다.
            mapObjRef.current.setStyle(mapStyle); 
        } catch (e) {
            // 무시 (Rebuilding style... 에러 방지)
        }
    }
  }, [mapStyle]);

  // 데이터 변경 시 deck.gl 레이어 동기화
  useEffect(() => {
    if (deckOverlayRef.current) {
      deckOverlayRef.current.setProps({ _animate: true,  layers: deckLayers });
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
    <div className={`group relative overflow-hidden bg-white ${isFullscreen ? "fixed inset-0 z-100 w-screen h-dvh" : (className ?? "")}`}>
      {/* 전체화면 토글 버튼 (좌측 상단) */}
      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-4 left-4 z-40 p-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl text-slate-700 hover:bg-white active:scale-95 transition-all"
        aria-label={isFullscreen ? "전체화면 종료" : "전체화면으로 보기"}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      {/* 테슬라 스타일 비네팅 오버레이 (선택 사항) */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.2)]" />
      <div ref={mapRef} className="w-full h-full" />

      {/* 우측 상단 FAB 메뉴 (통합 컨트롤) */}
      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-3">
        
        {/* 메인 FAB 버튼 */}
        <button
          type="button"
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 backdrop-blur-md border ${
            isFabOpen 
              ? "bg-slate-800 text-white rotate-90 border-slate-700" 
              : "bg-white/90 text-slate-800 hover:bg-white border-slate-200"
          }`}
        >
          {isFabOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* 메뉴 확장 시 나타나는 컨트롤들 */}
        {isFabOpen && (
          <div className="flex flex-col gap-3 animate-in slide-in-from-top-5 duration-300 items-end origin-top-right">
            
            {/* 1. 지도 모드 토글 */}
            <button
              type="button"
              onClick={() => setMapMode(prev => prev === "satellite" ? "standard" : "satellite")}
              className="px-4 py-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white flex items-center gap-2 transition-all w-full justify-end min-w-[140px]"
            >
              <span className="flex-1 text-right">{mapMode === "satellite" ? "일반지도" : "위성지도"}</span>
              {mapMode === "satellite" ? (
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><MapIcon className="w-3.5 h-3.5" /></div>
              ) : (
                <div className="p-1 rounded-full bg-blue-100 text-blue-600"><Layers className="w-3.5 h-3.5" /></div>
              )}
            </button>

            {/* 2. 경로 도구 토글 */}
            <button
              type="button"
              onClick={() => setIsRouteControlsOpen(!isRouteControlsOpen)}
              className={`px-4 py-2.5 rounded-2xl backdrop-blur-md border shadow-lg text-xs font-bold transition-all flex items-center gap-2 w-full justify-end min-w-[140px] ${
                isRouteControlsOpen 
                  ? "bg-orange-500 border-orange-600 text-white" 
                  : "bg-white/90 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <span className="flex-1 text-right">{isRouteControlsOpen ? "도구 닫기" : "경로 예측"}</span>
              <div className={`p-1 rounded-full ${isRouteControlsOpen ? "bg-white/20" : "bg-orange-100 text-orange-600"}`}>
                <Navigation className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 3. 나무 투명도 조절 (슬라이더) */}
            <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 flex flex-col gap-2 min-w-[160px]">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                <span>나무 투명도</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{Math.round(treeOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={treeOpacity}
                onChange={(e) => setTreeOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        )}
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


      {/* 선택된 땅(필지) 정보 표시 - 카드 UI 개선 (하단 배치) */}
      {selectedLand && (
        <div 
          className={`absolute left-4 z-30 w-[calc(100%-32px)] max-w-sm animate-in slide-in-from-bottom duration-300 transition-all ${
            isRouteControlsOpen ? "bottom-24" : "bottom-6"
          }`}
        >
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-5 rounded-4xl shadow-2xl text-slate-800 relative overflow-hidden group">
            
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-100/50 to-orange-100/50 rounded-bl-[4rem] -z-10" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 mb-1">
                  선택된 필지 정보
                </span>
                <h3 className="text-lg font-black text-slate-800 leading-tight">
                  {selectedLand.properties.addr || "주소 정보 없음"}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLand(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-lg">
                    📍
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">지번</span>
                    <span className="text-sm font-black text-slate-700 font-mono">{selectedLand.properties.jibun}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-lg">
                    📅
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">공시지가 기준년월</span>
                    <span className="text-sm font-black text-slate-700">
                      {selectedLand.properties.pnu 
                        ? `${selectedLand.properties.gosi_year}년 ${selectedLand.properties.gosi_month}월` 
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-1">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                  PNU: {selectedLand.properties.pnu}
                </span>
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