"use client";

import React from "react";
import { Info, ChevronRight } from "lucide-react";
import InstallPrompt from "../components/InstallPrompt";

const Dashboard: React.FC = () => {
  const stats = [
    { label: "전수조사 완료", value: "1,240", sub: "+12 이번 주", emoji: "✅" },
    { label: "지적변경건수", value: "42", sub: "3건 처리 중", emoji: "🗺️" },
    { label: "민원요청사항", value: "15", sub: "미확인 2건", emoji: "📧" },
    { label: "관리 농가수", value: "3,842", sub: "남원읍 전체", emoji: "🏡" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-8 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-top-2 duration-700 pb-28 md:pb-10">
      <header className="space-y-3 px-1">
        <InstallPrompt />
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#37352f]">
          대시보드
        </h1>
        <div className="flex items-start space-x-3 text-[#6b6a65] bg-[#fbfbfa] px-4 py-4 rounded-2xl border border-[#ececec] border-l-4 border-l-orange-500 text-xs md:text-sm shadow-sm">
          <Info className="mt-1 text-orange-500 w-4 h-4" />
          <p className="leading-relaxed font-medium">
            시스템이 최신 지적 정보를 기반으로 업데이트되었습니다.{" "}
            <br className="hidden md:block" />
            오늘의 실시간 재배 현황을 확인하고 효율적으로 관리하세요.
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-[#e9e9e7] active:bg-[#fbfbfa] active:scale-95 transition-all cursor-pointer group shadow-sm hover:shadow-md hover:border-orange-200"
          >
            <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
              {stat.emoji}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#9b9a97] uppercase tracking-[0.1em]">
                {stat.label}
              </p>
              <h3 className="text-2xl font-black text-[#37352f] group-hover:text-orange-600 transition-colors leading-none">
                {stat.value}
              </h3>
              <p className="text-[10px] text-[#6b6a65] font-bold">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2 items-start">
        {/* Recent Notifications */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-[#ececec] pb-3 px-1">
            <h3 className="font-black text-xl text-[#37352f] flex items-center">
              <span className="mr-2">🔔</span> 최근 알림
            </h3>
            <button className="text-[11px] font-black text-[#9b9a97] hover:text-[#37352f] transition-colors uppercase tracking-widest">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="group flex items-center justify-between py-4 px-4 rounded-2xl border border-transparent hover:border-[#ececec] hover:bg-[#fbfbfa] active:bg-[#f1f1ef] transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f1ef] flex items-center justify-center text-[10px] font-black text-[#9b9a97] flex-shrink-0 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                    0{i}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-[#37352f] truncate group-hover:text-orange-700">
                      남원읍 하례리 122-{i}{" "}
                      {i === 2 ? "신규 등록" : "경계 변경"}
                    </p>
                    <p className="text-xs text-[#9b9a97] mt-0.5 font-semibold">
                      지적 분할 및 합병에 따른 자동 변동 알림
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-black group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {/* Survey Chart Section - Fixed Clipping with expanded viewBox */}
        <div className="space-y-5">
          <div className="flex items-center border-b border-[#ececec] pb-3 px-1">
            <h3 className="font-black text-xl text-[#37352f]">📊 조사 현황</h3>
          </div>
          <div className="bg-[#fbfbfa] p-8 rounded-3xl border border-[#e9e9e7] flex flex-col items-center shadow-inner relative">
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* SVG viewBox expanded to 120 to provide buffer for 10px stroke */}
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-[#eee]"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="314.15"
                  strokeDashoffset="75.4"
                  strokeLinecap="round"
                  className="text-orange-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <span className="text-3xl font-black text-[#37352f] tracking-tighter">
                  76%
                </span>
                <span className="text-[10px] font-black text-[#9b9a97] uppercase tracking-widest mt-0.5">
                  Progress
                </span>
              </div>
            </div>

            <div className="w-full space-y-5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-[#6b6a65]">조사 완료율</span>
                <span className="text-orange-600">2,920 / 3,842</span>
              </div>
              <div className="w-full h-3 bg-[#eee] rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[76%] rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-1000"></div>
              </div>
              <div className="flex items-center justify-center space-x-4 pt-2">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-[10px] font-bold text-[#6b6a65]">
                    완료
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#eee]"></span>
                  <span className="text-[10px] font-bold text-[#6b6a65]">
                    미조사
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
