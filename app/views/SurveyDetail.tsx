"use client";

import React, { useState } from "react";
import { SurveyRecord, PersonInfo, SurveySubRecord } from "@/types";
import OLMapView from "@/app/components/MapView";
import {
  Plus,
  Edit2,
  Trash2,
  Pentagon,
  ChevronLeft,
  User,
  FileText,
  MapPin,
} from "lucide-react";

interface SurveyDetailProps {
  survey: SurveyRecord;
  onBack: () => void;
}

type TabType = "GENERAL" | "SURVEY" | "LOCATION";

const SurveyDetail: React.FC<SurveyDetailProps> = ({ survey, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>("GENERAL");
  const [localSurvey, setLocalSurvey] = useState<SurveyRecord>(survey);
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | "NEW" | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [tempSubRecord, setTempSubRecord] = useState<Partial<SurveySubRecord>>(
    {}
  );

  const [isEditingMap, setIsEditingMap] = useState(false);
  const [currentMapArea, setCurrentMapArea] = useState<number>(survey.area);
  const [currentBoundary, setCurrentBoundary] = useState<
    number[][] | undefined
  >(survey.boundary);

  // 이탈 방지 핸들러 (선택 사항: 뒤로 가기 시 확인)
  const handleBackWithConfirm = () => {
    if (isEditingGeneral || editingSubId || isEditingMap) {
      if (confirm("작성 중인 내용이 있습니다. 저장하지 않고 나가시겠습니까?")) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const handleSaveGeneral = () => {
    setIsEditingGeneral(false);
    alert("일반 정보가 저장되었습니다.");
  };

  const handleSaveMap = () => {
    setIsEditingMap(false);
    setLocalSurvey({
      ...localSurvey,
      boundary: currentBoundary,
      area: currentMapArea,
    });
    alert("지적 경계 정보가 수정되었습니다.");
  };

  const startEditSub = (sub?: SurveySubRecord) => {
    if (sub) {
      setEditingSubId(sub.id);
      setTempSubRecord({ ...sub });
    } else {
      setEditingSubId("NEW");
      setTempSubRecord({
        id: `sub-${Date.now()}`,
        category: "과수원",
        totalArea: 0,
        cultivationArea: 0,
        status: "정상경작",
        cultivator: "본인",
        hasFacility: false,
        type: "노지",
        varietyName: "",
        plantingYear: new Date().getFullYear().toString(),
        installYear: new Date().getFullYear().toString(),
        treeAge: 0,
        treeCount: 0,
        spacing: "3m",
        isHeated: false,
        otherType: "해당없음",
        nonCultivationDetail: "-",
        recordedAt: new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleSaveSub = () => {
    if (!editingSubId) return;
    let updatedRecords = [...(localSurvey.subRecords || [])];
    if (editingSubId === "NEW") {
      updatedRecords.push(tempSubRecord as SurveySubRecord);
    } else {
      updatedRecords = updatedRecords.map((r) =>
        r.id === editingSubId ? (tempSubRecord as SurveySubRecord) : r
      );
    }
    setLocalSurvey({ ...localSurvey, subRecords: updatedRecords });
    setEditingSubId(null);
    setTempSubRecord({});
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return;
    const updatedRecords = (localSurvey.subRecords || []).filter(
      (r) => r.id !== confirmDeleteId
    );
    setLocalSurvey({ ...localSurvey, subRecords: updatedRecords });
    setConfirmDeleteId(null);
  };

  const renderGeneralInfo = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section
          className={`bg-white p-6 rounded-3xl border transition-all ${
            isEditingGeneral
              ? "border-orange-500 ring-4 ring-orange-50"
              : "border-[#ececec] shadow-sm"
          } space-y-4`}
        >
          <div className="flex items-center justify-between border-b border-[#f1f1ef] pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">👨‍🌾</span>
              <h3 className="font-black text-[#37352f]">경영주 정보</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <EditableItem
              label="성명"
              value={localSurvey.ownerInfo?.name || localSurvey.ownerName}
              isEditing={isEditingGeneral}
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  ownerName: val,
                  ownerInfo: { ...localSurvey.ownerInfo!, name: val },
                })
              }
            />
            <EditableItem
              label="성별"
              value={localSurvey.ownerInfo?.gender || "남"}
              isEditing={isEditingGeneral}
              type="select"
              options={["남", "여"]}
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  ownerInfo: { ...localSurvey.ownerInfo!, gender: val as any },
                })
              }
            />
            <EditableItem
              label="생년월일"
              value={localSurvey.ownerInfo?.birthDate || ""}
              isEditing={isEditingGeneral}
              type="date"
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  ownerInfo: { ...localSurvey.ownerInfo!, birthDate: val },
                })
              }
            />
            <EditableItem
              label="연락처"
              value={localSurvey.ownerInfo?.phone || localSurvey.ownerPhone}
              isEditing={isEditingGeneral}
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  ownerPhone: val,
                  ownerInfo: { ...localSurvey.ownerInfo!, phone: val },
                })
              }
            />
            <div className="col-span-2">
              <EditableItem
                label="주소"
                value={localSurvey.ownerInfo?.address || localSurvey.address}
                isEditing={isEditingGeneral}
                onChange={(val) =>
                  setLocalSurvey({
                    ...localSurvey,
                    address: val,
                    ownerInfo: { ...localSurvey.ownerInfo!, address: val },
                  })
                }
              />
            </div>
          </div>
        </section>

        <section
          className={`bg-white p-6 rounded-3xl border transition-all ${
            isEditingGeneral
              ? "border-orange-500 ring-4 ring-orange-50"
              : "border-[#ececec] shadow-sm"
          } space-y-4`}
        >
          <div className="flex items-center justify-between border-b border-[#f1f1ef] pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📝</span>
              <h3 className="font-black text-[#37352f]">응답자 정보</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <EditableItem
              label="성명"
              value={localSurvey.respondentInfo?.name || ""}
              isEditing={isEditingGeneral}
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  respondentInfo: { ...localSurvey.respondentInfo!, name: val },
                })
              }
            />
            <EditableItem
              label="관계"
              value={localSurvey.respondentInfo?.relationship || ""}
              isEditing={isEditingGeneral}
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  respondentInfo: {
                    ...localSurvey.respondentInfo!,
                    relationship: val,
                  },
                })
              }
            />
            <EditableItem
              label="연락처"
              value={localSurvey.respondentInfo?.phone || ""}
              isEditing={isEditingGeneral}
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  respondentInfo: {
                    ...localSurvey.respondentInfo!,
                    phone: val,
                  },
                })
              }
            />
            <EditableItem
              label="성별"
              value={localSurvey.respondentInfo?.gender || "여"}
              isEditing={isEditingGeneral}
              type="select"
              options={["남", "여"]}
              onChange={(val) =>
                setLocalSurvey({
                  ...localSurvey,
                  respondentInfo: {
                    ...localSurvey.respondentInfo!,
                    gender: val as any,
                  },
                })
              }
            />
          </div>
        </section>
      </div>

      <div className="flex justify-center pt-4 pb-6">
        {isEditingGeneral ? (
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditingGeneral(false)}
              className="px-8 py-3.5 bg-white border border-[#ececec] text-[#6b6a65] rounded-2xl text-sm font-black"
            >
              취소
            </button>
            <button
              onClick={handleSaveGeneral}
              className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-orange-100"
            >
              정보 저장하기
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingGeneral(true)}
            className="px-8 py-3.5 bg-[#37352f] text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-gray-200"
          >
            일반정보 수정/등록
          </button>
        )}
      </div>
    </div>
  );

  const renderSurveyHistory = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-xl text-[#37352f]">현장조사 내역</h3>
        {!editingSubId && (
          <button
            onClick={() => startEditSub()}
            className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-black flex items-center space-x-2 shadow-lg shadow-orange-100"
          >
            <Plus className="w-3 h-3" />
            <span>조사 정보 추가</span>
          </button>
        )}
      </div>

      {editingSubId ? (
        <div className="bg-white rounded-[32px] border-2 border-orange-500 p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-8">
          <div className="flex items-center justify-between border-b border-[#f1f1ef] pb-4">
            <h4 className="text-lg font-black text-[#37352f]">
              {editingSubId === "NEW"
                ? "신규 조사 내역 등록"
                : "조사 내역 수정"}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EditableItem
              label="공부상 지목"
              value={tempSubRecord.category || ""}
              isEditing={true}
              type="select"
              options={["과수원", "전", "답", "임야", "기타"]}
              onChange={(v) =>
                setTempSubRecord({ ...tempSubRecord, category: v })
              }
            />
            <EditableItem
              label="공부상 면적(㎡)"
              value={tempSubRecord.totalArea?.toString() || ""}
              isEditing={true}
              type="number"
              onChange={(v) =>
                setTempSubRecord({ ...tempSubRecord, totalArea: Number(v) })
              }
            />
            <EditableItem
              label="실제 재배면적(㎡)"
              value={tempSubRecord.cultivationArea?.toString() || ""}
              isEditing={true}
              type="number"
              onChange={(v) =>
                setTempSubRecord({
                  ...tempSubRecord,
                  cultivationArea: Number(v),
                })
              }
            />
            <EditableItem
              label="품종명"
              value={tempSubRecord.varietyName || ""}
              isEditing={true}
              onChange={(v) =>
                setTempSubRecord({ ...tempSubRecord, varietyName: v })
              }
            />
            <EditableItem
              label="본수"
              value={tempSubRecord.treeCount?.toString() || ""}
              isEditing={true}
              type="number"
              onChange={(v) =>
                setTempSubRecord({ ...tempSubRecord, treeCount: Number(v) })
              }
            />
            <EditableItem
              label="경작상태"
              value={tempSubRecord.status || ""}
              isEditing={true}
              type="select"
              options={["정상경작", "부분방치", "전체방치", "폐원"]}
              onChange={(v) =>
                setTempSubRecord({ ...tempSubRecord, status: v })
              }
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#f1f1ef]">
            <button
              onClick={() => setEditingSubId(null)}
              className="px-6 py-3 bg-[#fbfbfa] border border-[#ececec] text-[#6b6a65] rounded-xl text-sm font-black"
            >
              취소
            </button>
            <button
              onClick={handleSaveSub}
              className="px-8 py-3 bg-orange-500 text-white rounded-xl text-sm font-black"
            >
              저장하기
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!localSurvey.subRecords || localSurvey.subRecords.length === 0 ? (
            <div className="bg-[#fbfbfa] border-2 border-dashed border-[#e9e9e7] rounded-3xl p-12 text-center text-[#9b9a97]">
              <p className="font-bold">등록된 조사 내역이 없습니다.</p>
            </div>
          ) : (
            localSurvey.subRecords.map((sub, idx) => (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-[#ececec] shadow-sm overflow-hidden group hover:border-orange-200 transition-all"
              >
                <div className="bg-[#fbfbfa] px-6 py-4 border-b border-[#f1f1ef] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 bg-white border border-[#ececec] text-[#37352f] rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-black text-[#37352f]">
                      조사일자: {sub.recordedAt}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEditSub(sub)}
                      className="p-2.5 text-[#9b9a97] hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(sub.id)}
                      className="p-2.5 text-[#9b9a97] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                  <DetailField label="공부상 지목" value={sub.category} />
                  <DetailField
                    label="공부상 면적"
                    value={`${sub.totalArea.toLocaleString()}㎡`}
                  />
                  <DetailField
                    label="재배면적"
                    value={`${sub.cultivationArea.toLocaleString()}㎡`}
                  />
                  <DetailField label="경작상태" value={sub.status} />
                  <DetailField label="경작자" value={sub.cultivator} />
                  <DetailField
                    label="시설여부"
                    value={sub.hasFacility ? "유" : "무"}
                  />
                  <DetailField label="구분" value={sub.type} />
                  <DetailField label="품명" value={sub.varietyName} />
                  <DetailField label="식재년도" value={sub.plantingYear} />
                  <DetailField label="설치년도" value={sub.installYear} />
                  <DetailField label="나무연령" value={`${sub.treeAge}년`} />
                  <DetailField label="본수" value={`${sub.treeCount}본`} />
                  <DetailField label="재식거리" value={sub.spacing} />
                  <DetailField
                    label="가온여부"
                    value={sub.isHeated ? "가온" : "비가온"}
                  />
                  <DetailField label="재배형태" value={sub.otherType} />
                  <DetailField
                    label="불경내역"
                    value={sub.nonCultivationDetail}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderLocationInfo = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      <div className="bg-white rounded-[32px] border border-[#ececec] overflow-hidden shadow-2xl h-[calc(100vh-220px)] min-h-[450px] relative">
        <OLMapView
          className="w-full h-full"
          data={[localSurvey]} // localSurvey는 handleSaveMap 호출 시 업데이트된 boundary를 포함하게 됨
          selectedId={localSurvey.id}
          isEditable={isEditingMap}
          useMobileLock={true}
          onGeometryChange={(area, coords) => {
            setCurrentMapArea(Math.round(area));
            setCurrentBoundary(coords);
          }}
        />

        <div className="absolute top-4 right-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-[#ececec] min-w-[140px]">
          <p className="text-[10px] font-black text-[#9b9a97] uppercase tracking-widest mb-1">
            계산된 면적
          </p>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-[#37352f] tracking-tighter">
              {currentMapArea.toLocaleString()}
            </span>
            <span className="text-xs font-black text-[#9b9a97]">㎡</span>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-30 flex space-x-3">
          {isEditingMap ? (
            <button
              onClick={handleSaveMap}
              className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl text-sm font-black shadow-2xl hover:bg-orange-600 transition-all active:scale-95"
            >
              경계 저장
            </button>
          ) : (
            <button
              onClick={() => setIsEditingMap(true)}
              className="px-8 py-3.5 bg-[#37352f] text-white rounded-2xl text-sm font-black shadow-2xl hover:bg-black transition-all flex items-center space-x-2 active:scale-95"
            >
              <Pentagon className="w-4 h-4" />
              <span>지적 경계 수정</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-8 px-4 md:px-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-10 relative">
      <header className="space-y-4">
        <button
          onClick={handleBackWithConfirm}
          className="flex items-center space-x-2 text-[#9b9a97] hover:text-[#37352f] transition-all group"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">
            목록으로 돌아가기
          </span>
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-black text-[#37352f] tracking-tight">
            {localSurvey.address}
          </h1>
          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                localSurvey.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {localSurvey.status === "completed" ? "조사완료" : "조사대기"}
            </span>
            <span className="text-[10px] font-bold text-[#d3d1cb]">
              ID: {localSurvey.id}
            </span>
          </div>
        </div>
      </header>

      <nav className="flex items-center space-x-8 border-b border-[#f1f1ef] sticky top-0 bg-white/80 backdrop-blur-md z-40">
        {[
          { id: "GENERAL", label: "일반정보", icon: User },
          { id: "SURVEY", label: "현장조사정보", icon: FileText },
          { id: "LOCATION", label: "위치정보", icon: MapPin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center space-x-2 pb-4 text-sm font-black transition-all relative ${
              activeTab === tab.id
                ? "text-orange-600"
                : "text-[#9b9a97] hover:text-[#37352f]"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full animate-in zoom-in-x duration-300"></div>
            )}
          </button>
        ))}
      </nav>

      <main className="min-h-[400px]">
        {activeTab === "GENERAL" && renderGeneralInfo()}
        {activeTab === "SURVEY" && renderSurveyHistory()}
        {activeTab === "LOCATION" && renderLocationInfo()}
      </main>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-[#ececec] space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-[28px] flex items-center justify-center text-4xl mx-auto shadow-inner">
                🗑️
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#37352f]">
                  조사 내역 삭제
                </h3>
                <p className="text-sm text-[#9b9a97] font-medium leading-relaxed">
                  이 조사 내역을 삭제하시겠습니까? 삭제 후에는 복구가
                  불가능합니다.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="py-4 rounded-2xl text-sm font-black text-[#6b6a65] bg-[#fbfbfa] border border-[#ececec]"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-4 rounded-2xl text-sm font-black text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-100"
              >
                삭제 승인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EditableItemProps {
  label: string;
  value: string;
  isEditing: boolean;
  type?: "text" | "date" | "number" | "select";
  options?: string[];
  onChange: (val: string) => void;
}
const EditableItem: React.FC<EditableItemProps> = ({
  label,
  value,
  isEditing,
  type = "text",
  options = [],
  onChange,
}) => (
  <div className="space-y-1.5 flex flex-col">
    <p className="text-[10px] font-black text-[#9b9a97] uppercase tracking-wider ml-1">
      {label}
    </p>
    {isEditing ? (
      type === "select" ? (
        <select
          className="w-full px-3 py-2.5 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-sm font-bold appearance-none focus:ring-2 focus:ring-orange-100 outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="w-full px-3 py-2.5 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-100 outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    ) : (
      <p className="text-[#37352f] font-bold bg-[#fbfbfa]/50 px-3 py-2.5 rounded-xl border border-transparent truncate">
        {value || "-"}
      </p>
    )}
  </div>
);

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="space-y-0.5">
    <p className="text-[9px] font-black text-[#d3d1cb] uppercase tracking-tight">
      {label}
    </p>
    <p className="text-xs font-extrabold text-[#37352f] truncate">{value}</p>
  </div>
);

export default SurveyDetail;
