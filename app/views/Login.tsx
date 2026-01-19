import Image from "next/image";
import React from "react";

interface LoginProps {
  onLogin: () => void;
  onNavigateToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToSignup }) => {
  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[32px] border border-[#ececec] shadow-xl shadow-orange-500/5">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-orange-500 rounded-3xl text-4xl shadow-lg shadow-orange-200 mb-2 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Image src="/jeju-symbol.png" alt="logo" width={100} height={100} />
          </div>
          <h1 className="text-2xl font-black text-[#37352f] tracking-tight">
            제주감귤 현장조사
          </h1>
          <p className="text-sm text-[#9b9a97] font-medium leading-relaxed">
            실시간 지적 정보와 농가 데이터를 <br /> 한눈에 관리하는 스마트
            플랫폼
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#9b9a97] uppercase tracking-widest ml-1">
              아이디
            </label>
            <input
              type="text"
              placeholder="아이디를 입력하세요"
              className="w-full px-5 py-4 bg-[#fbfbfa] border border-[#e9e9e7] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-[#9b9a97]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#9b9a97] uppercase tracking-widest ml-1">
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              className="w-full px-5 py-4 bg-[#fbfbfa] border border-[#e9e9e7] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-[#9b9a97]"
            />
          </div>
        </div>

        <button
          onClick={onLogin}
          className="w-full py-4 bg-[#37352f] text-white rounded-2xl text-sm font-black hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
        >
          로그인 하기
        </button>

        <div className="flex items-center justify-between px-2 pt-2">
          <button className="text-xs font-bold text-[#9b9a97] hover:text-[#37352f] transition-colors">
            아이디 찾기
          </button>
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <button className="text-xs font-bold text-[#9b9a97] hover:text-[#37352f] transition-colors">
            비밀번호 찾기
          </button>
          <div className="w-1 h-1 bg-black rounded-full"></div>
          <button
            onClick={onNavigateToSignup}
            className="text-xs font-black text-orange-600 hover:underline underline-offset-4"
          >
            회원가입
          </button>
        </div>

        <div className="pt-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#f1f1ef]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-black tracking-[0.2em]">
              <span className="bg-white px-3">소셜 로그인</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform">
              <Image src="/google.svg" alt="google" width={24} height={24} />
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white border border-[#ececec] flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform">
              <Image src="/naver.svg" alt="naver" width={24} height={24} />
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform text-white font-bold">
              <Image src="/kakaotalk.svg" alt="kakao" width={24} height={24} />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-[#9b9a97] font-bold uppercase tracking-widest">
        © 2026 제주특별자치도 감귤진흥과. All Rights Reserved.
      </p>
    </div>
  );
};

export default Login;
