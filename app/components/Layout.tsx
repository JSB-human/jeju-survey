import React from "react";
import { AppView } from "@/types";
import { Home, MapPin, Map, MessageSquare, Bell } from "lucide-react";
import Image from "next/image";

interface LayoutProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: "대시보드", icon: Home },
    { id: AppView.SURVEY_LIST, label: "전수조사", icon: MapPin },
    { id: AppView.LAND_CHANGES, label: "지적변경", icon: Map },
    { id: AppView.CIVIL_REQUESTS, label: "민원", icon: MessageSquare },
  ];

  const isDetailView = currentView === AppView.SURVEY_DETAIL;

  return (
    <div className="flex h-screen overflow-hidden bg-white flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-[#fbfbfa] border-r border-[#ececec] flex-col hidden md:flex">
        <div className="p-6 mb-2">
          <div className="flex items-center space-x-3 px-1 py-1 group cursor-pointer">
            <div className="w-15 h-15 rounded-lg flex items-center justify-center text-base shadow-sm group-hover:rotate-12 transition-transform">
              <Image
                src="/jeju-symbol.png"
                alt="logo"
                width={100}
                height={100}
              />
            </div>
            <span className="font-extrabold text-sm tracking-tight">
              제주감귤 현장조사
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <p className="px-3 text-[10px] font-black text-[#9b9a97] uppercase mb-2 mt-4 tracking-[0.1em]">
            Main Menu
          </p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                currentView === item.id
                  ? "bg-[#efefed] text-[#37352f] font-bold shadow-sm"
                  : "text-[#6b6a65] hover:bg-[#efefed] hover:text-[#37352f]"
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${
                  currentView === item.id ? "text-orange-600" : "text-[#9b9a97]"
                }`}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {!isDetailView && (
          <header className="h-14 bg-white/80 backdrop-blur-md flex items-center justify-between px-5 z-20 border-b border-[#f1f1ef] sticky top-0">
            <div className="flex items-center space-x-3">
              <div className="md:hidden w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs shadow-sm">
                🍊
              </div>
              <span className="font-black text-sm md:text-base tracking-tight text-[#37352f]">
                {menuItems.find((i) => i.id === currentView)?.label || "시스템"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-[#9b9a97] hover:bg-[#f1f1ef] p-2 rounded-xl transition-colors">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        <section
          className={`flex-1 overflow-y-auto custom-scrollbar bg-white ${
            isDetailView ? "pt-0" : ""
          }`}
        >
          {children}
        </section>

        {!isDetailView && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white/95 backdrop-blur-lg border-t border-[#ececec] flex items-center justify-around px-4 z-50">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center space-y-1.5 px-3 py-1 rounded-2xl transition-all duration-300 ${
                  currentView === item.id
                    ? "text-orange-600 scale-110"
                    : "text-[#9b9a97]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span
                  className={`text-[10px] font-bold ${
                    currentView === item.id ? "opacity-100" : "opacity-70"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
};

export default Layout;
