"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { MOCK_SURVEYS } from "@/constants";
import { SurveyRecord } from "@/types";
import OLMapView from "@/app/components/MapView";
import {
  FilterX,
  Filter,
  Search,
  ChevronDown,
  Check,
  Clock,
  ChevronRight,
} from "lucide-react";

interface SurveyListProps {
  onSelect: (survey: SurveyRecord) => void;
}

const REGIONS = ["전체 지역", "남원리", "하례리", "신례리", "위미리"];
const VARIETIES = [
  "전체 품종",
  "온주밀감-극조생-일남1호",
  "온주밀감-조생",
  "한라봉",
  "천혜향",
  "레드향",
  "황금향",
];

const SurveyList: React.FC<SurveyListProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("전체 지역");
  const [selectedVariety, setSelectedVariety] = useState("전체 품종");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 필터 확장 상태
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 검색형 셀렉트 상태
  const [isVarietyOpen, setIsVarietyOpen] = useState(false);
  const [varietySearch, setVarietySearch] = useState("");
  const varietyDropdownRef = useRef<HTMLDivElement>(null);

  const filteredVarieties = useMemo(() => {
    return VARIETIES.filter((v) =>
      v.toLowerCase().includes(varietySearch.toLowerCase())
    );
  }, [varietySearch]);

  const filteredData = useMemo(() => {
    return MOCK_SURVEYS.filter((s) => {
      const matchSearch =
        s.address.includes(searchTerm) || s.ownerName.includes(searchTerm);
      const matchRegion =
        selectedRegion === "전체 지역" || s.address.includes(selectedRegion);
      const matchVariety =
        selectedVariety === "전체 품종" || s.variety === selectedVariety;

      // 날짜 범위 필터 (surveyDate 기반)
      let matchDate = true;
      if (startDate && s.surveyDate < startDate) matchDate = false;
      if (endDate && s.surveyDate > endDate) matchDate = false;

      return matchSearch && matchRegion && matchVariety && matchDate;
    });
  }, [searchTerm, selectedRegion, selectedVariety, startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        varietyDropdownRef.current &&
        !varietyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsVarietyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full animate-in fade-in duration-500 overflow-hidden">
      {/* Map Section */}
      <div className="h-[40%] md:h-full md:flex-1 md:order-2 bg-[#f1f1ef] relative">
        <OLMapView
          className="w-full h-full"
          data={filteredData}
          selectedId={selectedId}
          onFeatureClick={(id) => setSelectedId(id)}
        />

        {selectedId && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:top-20 md:left-6 z-20 md:w-72 animate-in slide-in-from-bottom duration-300">
            {(() => {
              const s = MOCK_SURVEYS.find((i) => i.id === selectedId);
              if (!s) return null;
              return (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#ececec] shadow-2xl p-4 flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm text-[#37352f] truncate leading-tight">
                      {s.address}
                    </h3>
                    <p className="text-[11px] text-[#9b9a97] mt-0.5">
                      {s.ownerName} · {s.variety}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelect(s)}
                    className="px-4 py-2.5 bg-[#37352f] text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200"
                  >
                    상세보기
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* List Section */}
      <div className="h-[60%] md:h-full md:w-[420px] flex flex-col bg-white overflow-hidden md:order-1 border-r border-[#ececec]">
        <header className="p-5 border-b border-[#f1f1ef] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#37352f]">전수조사 목록</h2>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-widest">
                {filteredData.length} 건
              </span>
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isFilterExpanded
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-100"
                    : "bg-[#fbfbfa] border border-[#ececec] text-[#9b9a97]"
                }`}
              >
                {isFilterExpanded ? (
                  <FilterX className="w-4 h-4" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Search Bar (Always visible) */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b9a97] w-4 h-4" />
              <input
                type="text"
                placeholder="지번, 소유주 검색..."
                className="w-full pl-10 pr-4 py-3 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-100 placeholder:text-[#9b9a97]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Collapsible Filters */}
            {isFilterExpanded && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-2">
                  {/* Region Select */}
                  <div className="relative">
                    <p className="text-[9px] font-black text-[#9b9a97] uppercase mb-1 ml-1 tracking-wider">
                      지역 선택
                    </p>
                    <select
                      className="w-full px-3 py-2.5 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-[11px] font-black appearance-none outline-none focus:ring-2 focus:ring-orange-100"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 bottom-3 text-black w-3 h-3 pointer-events-none" />
                  </div>

                  {/* Variety Search Select */}
                  <div className="relative" ref={varietyDropdownRef}>
                    <p className="text-[9px] font-black text-[#9b9a97] uppercase mb-1 ml-1 tracking-wider">
                      품종 필터
                    </p>
                    <button
                      onClick={() => setIsVarietyOpen(!isVarietyOpen)}
                      className="w-full px-3 py-2.5 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-[11px] font-black text-left flex items-center justify-between outline-none focus:ring-2 focus:ring-orange-100"
                    >
                      <span className="truncate">{selectedVariety}</span>
                      <Search className="text-black w-3 h-3" />
                    </button>

                    {isVarietyOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#ececec] rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-[#f1f1ef]">
                          <input
                            type="text"
                            placeholder="품명 검색..."
                            className="w-full px-3 py-1.5 bg-[#fbfbfa] border border-[#e9e9e7] rounded-lg text-[10px] font-bold outline-none"
                            value={varietySearch}
                            onChange={(e) => setVarietySearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                          {filteredVarieties.length > 0 ? (
                            filteredVarieties.map((v) => (
                              <button
                                key={v}
                                onClick={() => {
                                  setSelectedVariety(v);
                                  setIsVarietyOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-orange-50 ${
                                  selectedVariety === v
                                    ? "text-orange-600 bg-orange-50"
                                    : "text-[#37352f]"
                                }`}
                              >
                                {v}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-center text-[10px] text-[#9b9a97] font-bold">
                              결과 없음
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Range Picker (Survey Date) */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-[#9b9a97] uppercase ml-1 tracking-widest">
                    조사 기간 (언제부터 ~ 언제까지)
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="date"
                        className="w-full px-3 py-2.5 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-100"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <span className="text-black text-xs">~</span>
                    <div className="flex-1 relative">
                      <input
                        type="date"
                        className="w-full px-3 py-2.5 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-100"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedRegion("전체 지역");
                    setSelectedVariety("전체 품종");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full py-2 text-[10px] font-black text-[#9b9a97] hover:text-orange-600 transition-colors bg-[#fbfbfa] rounded-xl border border-dashed border-[#ececec]"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-[#f8f8f7] pb-24 md:pb-0">
            {filteredData.length > 0 ? (
              filteredData.map((survey) => (
                <div
                  key={survey.id}
                  className={`p-5 transition-all cursor-pointer flex items-center space-x-4 ${
                    selectedId === survey.id
                      ? "bg-orange-50/50"
                      : "active:bg-[#fbfbfa]"
                  }`}
                  onClick={() => setSelectedId(survey.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      survey.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : survey.status === "pending"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {survey.status === "completed" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm tracking-tight truncate ${
                        selectedId === survey.id
                          ? "font-black text-[#37352f]"
                          : "font-bold text-[#37352f]"
                      }`}
                    >
                      {survey.address}
                    </p>
                    <p className="text-[11px] text-[#9b9a97] font-medium truncate mt-0.5">
                      {survey.ownerName} ·{" "}
                      <span className="text-orange-600/70">
                        {survey.variety}
                      </span>
                    </p>
                    {/* 조사일자 표시 추가 */}
                    <p className="text-[9px] text-[#636363] font-bold mt-1 tracking-tighter">
                      조사일: {survey.surveyDate}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-[#9b9a97]">
                      {survey.area.toLocaleString()}㎡
                    </span>
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${
                        selectedId === survey.id
                          ? "text-orange-400 translate-x-1"
                          : "text-[#9b9a97]"
                      }`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-2">
                <p className="text-sm font-black text-[#9b9a97]">
                  검색 결과가 없습니다.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedRegion("전체 지역");
                    setSelectedVariety("전체 품종");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-[11px] font-black text-orange-600 hover:underline"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyList;
