"use client";

import React, { useState, useMemo } from "react";
import { MOCK_CIVIL_REQUESTS } from "@/constants";
import { CivilRequest } from "@/types";
import OLMapView from "@/app/components/MapView";
import { SlidersHorizontal, CheckCircle, Phone } from "lucide-react";

interface CivilRequestListProps {
  onProcess: (request: CivilRequest) => void;
}

const CivilRequestList: React.FC<CivilRequestListProps> = ({ onProcess }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // 'all', 'pending', 'done'
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showNewModal, setShowNewModal] = useState<CivilRequest | null>(null);

  const filteredData = useMemo(() => {
    return MOCK_CIVIL_REQUESTS.filter((cr) => {
      // 유형 필터
      const matchType = filterType === "all" || cr.type === filterType;

      // 상태 필터 (pending: received/processing, done: done)
      let matchStatus = true;
      if (filterStatus === "pending") matchStatus = cr.status !== "done";
      if (filterStatus === "done") matchStatus = cr.status === "done";

      // 날짜 범위 필터
      let matchDate = true;
      if (startDate && cr.requestDate < startDate) matchDate = false;
      if (endDate && cr.requestDate > endDate) matchDate = false;

      return matchType && matchStatus && matchDate;
    });
  }, [filterType, filterStatus, startDate, endDate]);

  const handleActionClick = (cr: CivilRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cr.type === "new" && cr.status !== "done") {
      setShowNewModal(cr);
    } else {
      onProcess(cr);
    }
  };

  // Define the missing confirmNewRegister function to process new registration requests
  const confirmNewRegister = () => {
    if (showNewModal) {
      onProcess(showNewModal);
      setShowNewModal(null);
    }
  };

  // OLMapView를 위한 데이터 변환
  const mapData = filteredData.map((cr) => ({
    id: cr.id,
    address: cr.address,
    ownerName: cr.requester,
    ownerPhone: cr.requesterPhone,
    variety: cr.type === "new" ? "신규요청" : "변경요청",
    area: cr.area,
    status: cr.status === "done" ? "completed" : "pending",
    surveyDate: cr.requestDate,
    coordinates: cr.coordinates,
  }));

  return (
    <div className="flex flex-col md:flex-row h-full animate-in fade-in duration-500 overflow-hidden">
      {/* Map Section */}
      <div className="h-[40%] md:h-full md:flex-1 md:order-2 bg-[#f1f1ef] relative border-b md:border-b-0 md:border-l border-[#ececec]">
        <OLMapView
          className="w-full h-full"
          data={mapData as any}
          selectedId={selectedId}
          onFeatureClick={(id) => setSelectedId(id)}
        />

        {selectedId && (
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-20 md:w-72 animate-in slide-in-from-bottom duration-300">
            {(() => {
              const cr = MOCK_CIVIL_REQUESTS.find((i) => i.id === selectedId);
              if (!cr) return null;
              return (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#ececec] shadow-2xl p-4 flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${
                          cr.type === "new"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {cr.type === "new" ? "신규" : "변경"}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-[#37352f] truncate leading-tight">
                      {cr.address}
                    </h3>
                    <p className="text-[10px] text-[#9b9a97] truncate">
                      {cr.requester} ·{" "}
                      {cr.status === "done" ? "해결됨" : "처리중"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleActionClick(cr, e)}
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
            <h2 className="text-xl font-black text-[#37352f]">민원요청 사항</h2>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-widest">
                {filteredData.length} 건
              </span>
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isFilterExpanded
                    ? "bg-[#37352f] text-white shadow-lg shadow-gray-200"
                    : "bg-[#fbfbfa] border border-[#ececec] text-[#9b9a97]"
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* Status & Type Filters */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#9b9a97] uppercase ml-1 tracking-widest">
                  진행 상태
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "all", label: "전체" },
                    { id: "pending", label: "처리중" },
                    { id: "done", label: "해결됨" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFilterStatus(s.id)}
                      className={`py-2 rounded-xl text-[10px] font-black transition-all border ${
                        filterStatus === s.id
                          ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100"
                          : "bg-[#fbfbfa] text-[#9b9a97] border-[#ececec] hover:border-black"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#9b9a97] uppercase ml-1 tracking-widest">
                  요청 유형
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {["all", "new", "modify"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                        filterType === t
                          ? "bg-[#37352f] text-white border-[#37352f] shadow-md shadow-gray-100"
                          : "bg-[#fbfbfa] text-[#9b9a97] border-[#ececec]"
                      }`}
                    >
                      {t === "all" ? "전체" : t === "new" ? "신규" : "변경"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#9b9a97] uppercase ml-1 tracking-widest">
                  조회 기간 (언제부터 ~ 언제까지)
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-[10px] font-bold focus:outline-none"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <span className="text-black text-xs">~</span>
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-[10px] font-bold focus:outline-none"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterType("all");
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full py-2 text-[10px] font-black text-[#9b9a97] hover:text-orange-600 transition-colors bg-[#fbfbfa] rounded-xl border border-dashed border-[#ececec]"
              >
                필터 초기화
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <div className="divide-y divide-[#f8f8f7] pb-24 md:pb-0">
            {filteredData.length > 0 ? (
              filteredData.map((cr) => (
                <div
                  key={cr.id}
                  className={`p-5 transition-all cursor-pointer group relative ${
                    selectedId === cr.id
                      ? "bg-orange-50/40"
                      : "hover:bg-[#fbfbfa]"
                  }`}
                  onClick={() => setSelectedId(cr.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider ${
                          cr.type === "new"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {cr.type === "new" ? "신규" : "변경"}
                      </span>
                      <span
                        className={`flex items-center space-x-1.5 text-[9px] font-black ${
                          cr.status === "done"
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        {cr.status === "done" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        )}
                        <span>
                          {cr.status === "received"
                            ? "접수"
                            : cr.status === "processing"
                            ? "처리중"
                            : "해결됨"}
                        </span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-black">
                      {cr.requestDate}
                    </span>
                  </div>

                  <p
                    className={`text-sm tracking-tight mb-1 font-black text-[#37352f] truncate`}
                  >
                    {cr.address}
                  </p>
                  <div className="flex items-center space-x-3 mb-3">
                    <p className="text-[10px] font-bold text-[#37352f]">
                      <span className="text-[#9b9a97] font-medium mr-1">
                        요청자:
                      </span>{" "}
                      {cr.requester}
                    </p>
                    <p className="text-[10px] font-bold text-[#9b9a97] flex items-center">
                      <Phone className="mr-1.5 w-2.5 h-2.5" />
                      {cr.requesterPhone}
                    </p>
                  </div>

                  <div className="bg-[#fbfbfa] p-3 rounded-2xl border border-[#f1f1ef] mb-4">
                    <p className="text-[11px] text-[#6b6a65] font-medium leading-relaxed line-clamp-2 italic">
                      "{cr.details}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-black">
                      {cr.area.toLocaleString()}㎡
                    </span>
                    <button
                      onClick={(e) => handleActionClick(cr, e)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm border ${
                        cr.status === "done"
                          ? "bg-[#fbfbfa] border-[#ececec] text-[#9b9a97] cursor-default"
                          : "bg-white border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                      }`}
                    >
                      {cr.status === "done"
                        ? "조회하기"
                        : cr.type === "new"
                        ? "대장 생성"
                        : "수정/편집"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-3">
                <div className="text-4xl">🍃</div>
                <p className="text-sm font-black text-[#9b9a97]">
                  해당 기간의 민원 내역이 없습니다.
                </p>
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-xs font-black text-orange-600 hover:underline"
                >
                  필터 모두 해제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Registration Confirmation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-[#ececec] space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-[28px] flex items-center justify-center text-4xl mx-auto shadow-inner">
                📝
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#37352f]">
                  신규 민원 대장 생성
                </h3>
                <p className="text-sm text-[#9b9a97] font-medium leading-relaxed">
                  <span className="text-[#37352f] font-black">
                    [{showNewModal.address}]
                  </span>{" "}
                  지번에 대해 <br />
                  새로운 재배대장을 생성하시겠습니까?
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowNewModal(null)}
                className="py-4 rounded-2xl text-sm font-black text-[#6b6a65] bg-[#fbfbfa] border border-[#ececec]"
              >
                닫기
              </button>
              <button
                onClick={confirmNewRegister}
                className="py-4 rounded-2xl text-sm font-black text-white bg-orange-500 shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >
                생성 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CivilRequestList;
