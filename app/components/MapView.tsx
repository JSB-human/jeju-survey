"use client";

import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Icon, Stroke, Fill, Circle as CircleStyle } from "ol/style";
import { Draw, Modify, Snap } from "ol/interaction";
import { getArea } from "ol/sphere";
import {
  Plus,
  Minus,
  Crosshair,
  RotateCcw,
  Trash2,
  Hand,
  Layers,
} from "lucide-react";

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_KEY;

interface MapData {
  id: string;
  coordinates: { lat: number; lng: number };
  boundary?: number[][]; // [[lng, lat], [lng, lat], ...]
  status?: string;
  type?: string;
  [key: string]: any;
}

interface OLMapViewProps {
  data: MapData[];
  selectedId: string | null;
  className?: string;
  isEditable?: boolean;
  useMobileLock?: boolean;
  onFeatureClick?: (id: string) => void;
  onGeometryChange?: (area: number, coordinates: any) => void;
}

const OLMapView: React.FC<OLMapViewProps> = ({
  data,
  selectedId,
  className,
  isEditable = false,
  useMobileLock = false,
  onFeatureClick,
  onGeometryChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapObj, setMapObj] = useState<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);

  const [isLocked, setIsLocked] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mapType, setMapType] = useState<"Base" | "Satellite">("Satellite");

  // 모바일 화면 감지
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsLocked(false);
    };

    if (useMobileLock && isMobile) {
      setIsLocked(true);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [useMobileLock, isMobile]);

  // 지도 초기화 (최초 1회)
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. 레이어 정의
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Satellite/{z}/{y}/{x}.jpeg`,
      }),
      visible: true, // 초기값 true (Satellite가 기본)
      properties: { name: "satellite" },
    });

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`,
      }),
      visible: false, // 초기값 false
      properties: { name: "base" },
    });

    const hybridLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/Hybrid/{z}/{y}/{x}.png`,
      }),
      visible: true, // 초기값 true (Satellite와 함께 표시)
      properties: { name: "hybrid" },
    });

    // VWorld 키가 없을 때를 대비한 OSM 레이어
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: !VWORLD_API_KEY,
      properties: { name: "osm" },
    });

    // 벡터 레이어 (마커/다각형용)
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 10,
      style: (feature) => {
        const geometry = feature.getGeometry();
        const isSelected = feature.get("isSelected");

        // 감귤색 테마
        const strokeColor = isSelected ? "#ea580c" : "#f97316";
        const fillColor = isSelected
          ? "rgba(234, 88, 12, 0.4)"
          : "rgba(249, 115, 22, 0.2)";

        if (geometry instanceof Polygon) {
          // 폴리곤 스타일 (영역)
          const styles = [
            new Style({
              stroke: new Stroke({
                color: strokeColor,
                width: isSelected ? 4 : 2,
              }),
              fill: new Fill({ color: fillColor }),
            }),
          ];

          // 선택되었거나 아이템이 하나뿐일 때(상세보기) 중심점 아이콘도 표시
          if (isSelected || data.length === 1) {
            const interiorPoint = geometry.getInteriorPoint();
            // 커스텀 SVG 마커 (기존 코드 재사용)
            const svg = `
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
                <path d="M20 2C11.163 2 4 9.163 4 18c0 11 16 20 16 20s16-9 16-20c0-8.837-7.163-16-16-16z" fill="${strokeColor}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
                <circle cx="20" cy="18" r="6" fill="white"/>
              </svg>`;

            styles.push(
              new Style({
                geometry: interiorPoint,
                image: new Icon({
                  anchor: [0.5, 1],
                  src:
                    "data:image/svg+xml;charset=utf-8," +
                    encodeURIComponent(svg),
                  scale: isSelected ? 1.0 : 0.8,
                }),
                zIndex: 20,
              })
            );
          }
          return styles;
        }

        // 기본 마커 스타일 (Point일 경우 - fallback)
        const svg = `
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
            </filter>
            <path d="M20 2C11.163 2 4 9.163 4 18c0 11 16 20 16 20s16-9 16-20c0-8.837-7.163-16-16-16z" fill="${strokeColor}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
            <circle cx="20" cy="18" r="6" fill="white"/>
          </svg>`;

        return new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
            scale: isSelected ? 1.2 : 1.0,
          }),
          zIndex: isSelected ? 999 : 10,
        });
      },
    });

    // 2. 맵 생성
    const layers = VWORLD_API_KEY
      ? [baseLayer, satelliteLayer, hybridLayer, vectorLayer]
      : [osmLayer, vectorLayer];

    const map = new Map({
      target: mapRef.current,
      layers: layers,
      view: new View({
        center: fromLonLat([126.7121, 33.2801]),
        zoom: 15,
        smoothExtentConstraint: true,
      }),
      controls: [], // 기본 컨트롤 제거
    });

    setMapObj(map);

    return () => map.setTarget(undefined);
  }, []);

  // 클릭 이벤트 리스너 등록/갱신
  useEffect(() => {
    if (!mapObj) return;

    const clickHandler = (evt: any) => {
      if (isEditable || isLocked) return;

      const feature = mapObj.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature && onFeatureClick) {
        onFeatureClick(feature.getId() as string);
      }
    };

    mapObj.on("click", clickHandler);
    return () => mapObj.un("click", clickHandler);
  }, [mapObj, isEditable, isLocked, onFeatureClick]);

  // 지도 타입 변경
  useEffect(() => {
    if (!mapObj) return;

    const layers = mapObj.getLayers();
    layers.forEach((layer) => {
      const name = layer.get("name");
      if (name === "satellite") {
        layer.setVisible(mapType === "Satellite");
      } else if (name === "base") {
        layer.setVisible(mapType === "Base");
      } else if (name === "hybrid") {
        // 하이브리드는 위성일 때 같이 킴
        layer.setVisible(mapType === "Satellite");
      }
    });
  }, [mapType, mapObj]);

  // 데이터 변경 시 마커/폴리곤 업데이트
  useEffect(() => {
    if (!vectorSourceRef.current || !data) return;

    const source = vectorSourceRef.current;
    source.clear();

    const features = data.map((item) => {
      let feature;

      // 1. 경계 데이터가 있으면 폴리곤 생성
      if (item.boundary && item.boundary.length > 0) {
        // boundary는 [[lng, lat], ...] 형태의 2차원 배열이라 가정하고
        // OpenLayers Polygon은 [[[lng, lat], ...]] 형태의 3차원 배열(Ring)을 받음
        const coordinates = [item.boundary.map((coord) => fromLonLat(coord))];
        feature = new Feature({
          geometry: new Polygon(coordinates),
        });
      }
      // 2. 경계 데이터가 없으면 중심점 기준 자동 사각형 폴리곤 생성
      else {
        const center = fromLonLat([item.coordinates.lng, item.coordinates.lat]);
        // 대략 20~30m 정도의 오프셋 (줌 레벨에 따라 적절한 크기로)
        const offset = 20; // meters (approximately) at this scale
        // Web Mercator 좌표계에서의 대략적 크기 계산 (간단하게 처리)
        // 실제로는 위도에 따라 다르지만 시각적 표현을 위해 고정값 사용
        const dx = 30;
        const dy = 30;

        const squareCoords = [
          [
            [center[0] - dx, center[1] - dy],
            [center[0] + dx, center[1] - dy],
            [center[0] + dx, center[1] + dy],
            [center[0] - dx, center[1] + dy],
            [center[0] - dx, center[1] - dy], // 닫힌 루프
          ],
        ];

        feature = new Feature({
          geometry: new Polygon(squareCoords),
        });
      }

      feature.setId(item.id);
      feature.set("isSelected", item.id === selectedId);
      return feature;
    });

    source.addFeatures(features);

    // 선택된 아이템으로 뷰 이동
    if (selectedId && mapObj) {
      const selected = data.find((d) => d.id === selectedId);
      if (selected) {
        mapObj.getView().animate({
          center: fromLonLat([
            selected.coordinates.lng,
            selected.coordinates.lat,
          ]),
          duration: 700,
          zoom: 18, // 줌 레벨을 조금 더 당겨서 영역이 잘 보이게 함
        });
      }
    }
  }, [data, selectedId, mapObj]);

  // 편집 기능 관리
  useEffect(() => {
    if (!mapObj || !vectorSourceRef.current) return;

    const map = mapObj;
    const source = vectorSourceRef.current;

    // 기존 인터랙션 제거
    map.getInteractions().forEach((interaction) => {
      if (
        interaction instanceof Draw ||
        interaction instanceof Modify ||
        interaction instanceof Snap
      ) {
        map.removeInteraction(interaction);
      }
    });

    if (isEditable && !isLocked) {
      const modify = new Modify({ source });
      map.addInteraction(modify);

      // Draw는 기존 피처가 없을 때만 활성화하거나, 추가적인 영역을 그릴 때 사용
      // 여기서는 기존 영역 수정을 우선으로 하므로, Draw는 버튼(초기화)을 통해 기존 것을 지우고 새로 그릴 때 사용됨.
      // 하지만 isEditable 상태에서 빈 맵이라면 바로 그릴 수 있어야 함.

      const draw = new Draw({
        source: source,
        type: "Polygon",
        style: new Style({
          fill: new Fill({ color: "rgba(249, 115, 22, 0.3)" }),
          stroke: new Stroke({
            color: "#f97316",
            lineDash: [10, 10],
            width: 2,
          }),
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({ color: "#f97316" }),
            fill: new Fill({ color: "rgba(255, 255, 255, 0.5)" }),
          }),
        }),
      });

      draw.on("drawend", (event) => {
        const geometry = event.feature.getGeometry() as Polygon;

        // 새로 그려진 geometry의 좌표를 LonLat으로 변환하여 상위로 전달
        if (onGeometryChange) {
          const coords = geometry
            .getCoordinates()[0]
            .map((coord: any) => toLonLat(coord));
          onGeometryChange(getArea(geometry), coords);
        }
      });

      drawInteractionRef.current = draw;
      map.addInteraction(draw);
      map.addInteraction(new Snap({ source }));

      modify.on("modifyend", (event) => {
        const features = event.features.getArray();
        if (features.length > 0) {
          const geometry = features[0].getGeometry() as Polygon;
          if (onGeometryChange) {
            const coords = geometry
              .getCoordinates()[0]
              .map((coord: any) => toLonLat(coord));
            onGeometryChange(getArea(geometry), coords);
          }
        }
      });
    }
  }, [isEditable, isLocked, onGeometryChange, mapObj]);

  // 커스텀 컨트롤 핸들러
  const zoomIn = () =>
    mapObj?.getView().setZoom((mapObj?.getView().getZoom() || 0) + 1);

  const zoomOut = () =>
    mapObj?.getView().setZoom((mapObj?.getView().getZoom() || 0) - 1);

  const resetView = () => {
    if (data.length > 0 && mapObj) {
      mapObj.getView().animate({
        center: fromLonLat([data[0].coordinates.lng, data[0].coordinates.lat]),
        zoom: 15,
        duration: 1000,
      });
    }
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === "Base" ? "Satellite" : "Base"));
  };

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <div className="flex flex-col bg-white/90 backdrop-blur-md border border-[#ececec] rounded-2xl shadow-xl overflow-hidden">
          <button
            onClick={zoomIn}
            className="w-10 h-10 flex items-center justify-center text-[#37352f] hover:bg-orange-50 hover:text-orange-600 transition-all"
            title="확대"
          >
            <Plus className="w-3 h-3" />
          </button>
          <div className="h-[1px] bg-[#f1f1ef] mx-2"></div>
          <button
            onClick={zoomOut}
            className="w-10 h-10 flex items-center justify-center text-[#37352f] hover:bg-orange-50 hover:text-orange-600 transition-all"
            title="축소"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={resetView}
          className="w-10 h-10 bg-white/90 backdrop-blur-md border border-[#ececec] rounded-2xl shadow-xl flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
          title="내 위치로"
        >
          <Crosshair className="w-3 h-3" />
        </button>

        <button
          onClick={toggleMapType}
          className={`w-10 h-10 backdrop-blur-md border border-[#ececec] rounded-2xl shadow-xl flex items-center justify-center transition-all ${
            mapType === "Satellite"
              ? "bg-orange-600 text-white hover:bg-orange-700"
              : "bg-white/90 text-[#37352f] hover:bg-[#fbfbfa]"
          }`}
          title={mapType === "Base" ? "위성지도로 전환" : "일반지도로 전환"}
        >
          <Layers className="w-3 h-3" />
        </button>
      </div>

      {/* Editing Tools */}
      {isEditable && !isLocked && (
        <div className="absolute top-52 right-4 z-10 flex flex-col space-y-2 animate-in slide-in-from-right duration-300">
          <button
            onClick={() => drawInteractionRef.current?.removeLastPoint()}
            className="w-10 h-10 bg-white border border-[#ececec] rounded-2xl shadow-xl flex items-center justify-center text-[#37352f] hover:bg-orange-50 transition-all"
            title="마지막 점 취소"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              vectorSourceRef.current?.clear();
              if (onGeometryChange) onGeometryChange(0, []);
            }}
            className="w-10 h-10 bg-white border border-[#ececec] rounded-2xl shadow-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
            title="초기화"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Mobile Lock Overlay */}
      {useMobileLock && isMobile && isLocked && (
        <div
          onClick={() => setIsLocked(false)}
          className="absolute inset-0 z-20 bg-black/5 backdrop-blur-[1px] flex items-center justify-center cursor-pointer"
        >
          <div className="bg-white/95 px-5 py-3 rounded-2xl shadow-2xl border border-[#ececec] flex items-center space-x-3 animate-in zoom-in duration-300">
            <Hand className="w-4 h-4 text-orange-500 animate-bounce" />
            <span className="text-xs font-black text-[#37352f]">
              탭하여 지도 잠금 해제
            </span>
          </div>
        </div>
      )}

      {!VWORLD_API_KEY && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-0 pointer-events-none opacity-50">
          <p className="text-[10px] text-gray-500">
            VWorld API Key Required for satellite view
          </p>
        </div>
      )}
    </div>
  );
};

export default OLMapView;
