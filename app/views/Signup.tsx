import React from "react";
import { ArrowLeft } from "lucide-react";

interface SignupProps {
  onBack: () => void;
  onSignupComplete: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBack, onSignupComplete }) => {
  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col items-center justify-center p-6 animate-in slide-in-from-right duration-500">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[32px] border border-[#ececec] shadow-xl shadow-orange-500/5">
        <div className="space-y-2">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-[#9b9a97] hover:text-[#37352f] transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="text-xs font-black uppercase tracking-widest">
              Back to Login
            </span>
          </button>
          <h1 className="text-2xl font-black text-[#37352f] tracking-tight">
            계정 만들기
          </h1>
          <p className="text-sm text-[#9b9a97] font-medium leading-relaxed">
            농가 관리를 위한 담당자 정보를 입력해주세요.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#9b9a97] uppercase tracking-widest ml-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="이름 (실명)"
              className="w-full px-5 py-4 bg-[#fbfbfa] border border-[#e9e9e7] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-black"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#9b9a97] uppercase tracking-widest ml-1">
              Affiliation / Region
            </label>
            <select className="w-full px-5 py-4 bg-[#fbfbfa] border border-[#e9e9e7] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all">
              <option>남원읍 하례리</option>
              <option>남원읍 신례리</option>
              <option>남원읍 위미리</option>
              <option>성산읍</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#9b9a97] uppercase tracking-widest ml-1">
              Contact Number
            </label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              className="w-full px-5 py-4 bg-[#fbfbfa] border border-[#e9e9e7] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-black"
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center space-x-3 p-1">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-xs font-bold text-[#6b6a65] cursor-pointer"
              >
                개인정보 수집 및 이용약관에 동의합니다.
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={onSignupComplete}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl text-sm font-black hover:bg-orange-600 active:scale-[0.98] transition-all shadow-xl shadow-orange-100"
        >
          회원가입 완료하기
        </button>
      </div>
    </div>
  );
};

export default Signup;
