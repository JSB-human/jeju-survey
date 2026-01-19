"use client";

import React, { useState, useMemo } from "react";
import { MOCK_LAND_CHANGES } from "@/constants";
import { LandChange } from "@/types";
import OLMapView from "@/app/components/MapView";
import {
  ArrowDown01,
  ArrowUp10,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

interface LandChangeListProps {
  onEdit: (change: LandChange) => void;
}

const LandChangeList: React.FC<LandChangeListProps> = ({ onEdit }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<LandChange | null>(
    null
  );

  const availableMonths = useMemo(() => {
    const months = MOCK_LAND_CHANGES.map((lc) => lc.changeDate.substring(0, 7));
    return [
      "all",
      ...Array.from(new Set(months)).sort((a, b) => b.localeCompare(a)),
    ];
  }, []);

  const filteredData = useMemo(() => {
    return MOCK_LAND_CHANGES.filter(
      (lc) => filterType === "all" || lc.type === filterType
    )
      .filter(
        (lc) => monthFilter === "all" || lc.changeDate.startsWith(monthFilter)
      )
      .sort((a, b) => {
        return sortOrder === "desc"
          ? b.changeDate.localeCompare(a.changeDate)
          : a.changeDate.localeCompare(b.changeDate);
      });
  }, [filterType, monthFilter, sortOrder]);

  const handleEditClick = (lc: LandChange, e: React.MouseEvent) => {
    e.stopPropagation();
    if (lc.type === "new") {
      setShowConfirmModal(lc);
    } else {
      onEdit(lc);
    }
  };

  // OLMapView를 위한 데이터 변환
  const mapData = filteredData.map((lc) => ({
    id: lc.id,
    coordinates: lc.coordinates,
    type: lc.type,
    address: lc.address,
  }));

  return (
    <div className="flex flex-col md:flex-row h-full animate-in fade-in duration-500 overflow-hidden">
      {/* Map Section */}
      <div className="h-[40%] md:h-full md:flex-1 md:order-2 bg-[#f1f1ef] relative border-b md:border-b-0 md:border-l border-[#ececec]">
        <OLMapView
          className="w-full h-full"
          data={mapData}
          selectedId={selectedId}
          onFeatureClick={(id) => setSelectedId(id)}
        />

        {/* Floating selected info on map (mobile/desktop) */}
        {selectedId && (
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-20 md:w-72 animate-in slide-in-from-bottom duration-300">
            {(() => {
              const lc = MOCK_LAND_CHANGES.find((i) => i.id === selectedId);
              if (!lc) return null;
              return (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#ececec] shadow-2xl p-4 flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${
                          lc.type === "new"
                            ? "bg-green-100 text-green-700"
                            : lc.type === "modify"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {lc.type === "new"
                          ? "신규"
                          : lc.type === "modify"
                          ? "변경"
                          : "삭제"}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-[#37352f] truncate leading-tight">
                      {lc.address}
                    </h3>
                    <p className="text-[10px] text-[#9b9a97] truncate">
                      {lc.changeDate}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleEditClick(lc, e)}
                    className="px-4 py-2.5 bg-[#37352f] text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200"
                  >
                    확인
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* List Section */}
      <div className="h-[60%] md:h-full md:w-[420px] md:order-1 flex flex-col bg-white overflow-hidden border-r border-[#ececec]">
        <header className="p-5 border-b border-[#f1f1ef] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#37352f]">지적변경 내역</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
                className="w-9 h-9 bg-[#fbfbfa] border border-[#ececec] rounded-xl text-[#9b9a97] flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all"
              >
                {sortOrder === "desc" ? (
                  <ArrowDown01 className="w-3 h-3" />
                ) : (
                  <ArrowUp10 className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center ${
                  isFilterExpanded
                    ? "bg-[#37352f] text-white shadow-lg"
                    : "bg-[#fbfbfa] border border-[#ececec] text-[#9b9a97]"
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-4 gap-1.5">
                {["all", "new", "modify", "delete"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                      filterType === t
                        ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100"
                        : "bg-[#fbfbfa] text-[#9b9a97] border-[#ececec]"
                    }`}
                  >
                    {t === "all"
                      ? "전체"
                      : t === "new"
                      ? "신규"
                      : t === "modify"
                      ? "변경"
                      : "삭제"}
                  </button>
                ))}
              </div>
              <div className="relative">
                <p className="text-[9px] font-black text-[#9b9a97] uppercase mb-1.5 ml-1 tracking-wider">
                  변동월 선택
                </p>
                <select
                  className="w-full px-4 py-3 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-[11px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m === "all" ? "전체 기간" : m.replace("-", "년 ") + "월"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 bottom-4 text-black w-3 h-3 pointer-events-none" />
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-[#f8f8f7] pb-24 md:pb-0">
            {filteredData.length > 0 ? (
              filteredData.map((lc) => (
                <div
                  key={lc.id}
                  className={`p-5 transition-all cursor-pointer relative ${
                    selectedId === lc.id
                      ? "bg-orange-50/40"
                      : "hover:bg-[#fbfbfa]"
                  }`}
                  onClick={() => setSelectedId(lc.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest ${
                        lc.type === "new"
                          ? "bg-green-100 text-green-700"
                          : lc.type === "modify"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {lc.type === "new"
                        ? "신규 등록"
                        : lc.type === "modify"
                        ? "정보 변경"
                        : "지번 삭제"}
                    </span>
                    <span className="text-[10px] font-bold text-black">
                      {lc.changeDate}
                    </span>
                  </div>
                  <p
                    className={`text-sm tracking-tight mb-1 font-black text-[#37352f] truncate`}
                  >
                    {lc.address}
                  </p>
                  <p className="text-[11px] text-[#9b9a97] font-medium leading-relaxed line-clamp-1 mb-4 italic">
                    "{lc.details}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-black bg-[#fbfbfa] px-2 py-0.5 rounded border border-[#ececec]">
                      {lc.area.toLocaleString()}㎡
                    </span>
                    <button
                      onClick={(e) => handleEditClick(lc, e)}
                      className="px-5 py-2 bg-white border border-[#ececec] rounded-xl text-[10px] font-black text-[#37352f] hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm active:scale-95"
                    >
                      {lc.type === "new" ? "대장 생성" : "내용 편집"}
                    </button>
                  </div>
                  {selectedId === lc.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 animate-in fade-in duration-300"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-3">
                <div className="text-4xl">🔎</div>
                <p className="text-sm font-black text-[#9b9a97]">
                  조건에 맞는 변동 내역이 없습니다.
                </p>
                <button
                  onClick={() => {
                    setFilterType("all");
                    setMonthFilter("all");
                  }}
                  className="text-xs font-black text-orange-600 hover:underline"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-[#ececec] space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-[28px] flex items-center justify-center text-4xl mx-auto shadow-inner">
                ✨
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#37352f]">
                  신규 조사대장 생성
                </h3>
                <p className="text-sm text-[#9b9a97] font-medium leading-relaxed text-center">
                  <span className="text-[#37352f] font-black">
                    [{showConfirmModal.address}]
                  </span>{" "}
                  지적 변동에 대해 <br />
                  새로운 재배대장을 생성하시겠습니까?
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="py-4 rounded-2xl text-sm font-black text-[#6b6a65] bg-[#fbfbfa] border border-[#ececec]"
              >
                나중에
              </button>
              <button
                onClick={() => {
                  onEdit(showConfirmModal);
                  setShowConfirmModal(null);
                }}
                className="py-4 rounded-2xl text-sm font-black text-white bg-orange-500 shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >
                지금 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandChangeList;
