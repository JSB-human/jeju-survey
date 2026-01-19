"use client";

import React, { useState } from "react";
import { AppView, SurveyRecord, LandChange, CivilRequest } from "@/types";
import Layout from "@/app/components/Layout";
import Dashboard from "@/app/views/Dashboard";
import SurveyList from "@/app/views/SurveyList";
import SurveyDetail from "@/app/views/SurveyDetail";
import LandChangeList from "@/app/views/LandChangeList";
import CivilRequestList from "@/app/views/CivilRequestList";
import Login from "@/app/views/Login";
import Signup from "@/app/views/Signup";

const MainClient: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyRecord | null>(
    null
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleSignupComplete = () => {
    setCurrentView(AppView.LOGIN);
  };

  const handleSurveySelect = (survey: SurveyRecord) => {
    setSelectedSurvey(survey);
    setCurrentView(AppView.SURVEY_DETAIL);
  };

  const handleLandChangeEdit = (lc: LandChange) => {
    const tempSurvey: SurveyRecord = {
      id: lc.id,
      address: lc.address,
      ownerName: "미지정 (지적변경)",
      ownerPhone: "-",
      variety: "변동 확인 필요",
      area: lc.area,
      status: "pending",
      surveyDate: lc.changeDate,
      coordinates: lc.coordinates,
      subRecords: [],
    };
    setSelectedSurvey(tempSurvey);
    setCurrentView(AppView.SURVEY_DETAIL);
  };

  const handleCivilRequestProcess = (cr: CivilRequest) => {
    // 민원 요청 정보를 SurveyRecord 형식으로 변환하여 상세페이지 연결
    const tempSurvey: SurveyRecord = {
      id: cr.id,
      address: cr.address,
      ownerName: cr.requester,
      ownerPhone: "-",
      variety: cr.type === "new" ? "신규등록 예정" : "수정요청 접수",
      area: cr.area,
      status: "pending",
      surveyDate: cr.requestDate,
      coordinates: cr.coordinates,
      subRecords: [],
      respondentInfo: {
        name: cr.requester,
        address: cr.address,
        phone: "-",
        birthDate: "-",
        gender: "남",
        description: `민원 내용: ${cr.details}`,
      },
    };
    setSelectedSurvey(tempSurvey);
    setCurrentView(AppView.SURVEY_DETAIL);
  };

  if (!isLoggedIn) {
    if (currentView === AppView.SIGNUP) {
      return (
        <Signup
          onBack={() => setCurrentView(AppView.LOGIN)}
          onSignupComplete={handleSignupComplete}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onNavigateToSignup={() => setCurrentView(AppView.SIGNUP)}
      />
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.SURVEY_LIST:
        return <SurveyList onSelect={handleSurveySelect} />;
      case AppView.LAND_CHANGES:
        return <LandChangeList onEdit={handleLandChangeEdit} />;
      case AppView.CIVIL_REQUESTS:
        return <CivilRequestList onProcess={handleCivilRequestProcess} />;
      case AppView.SURVEY_DETAIL:
        return selectedSurvey ? (
          <SurveyDetail
            survey={selectedSurvey}
            onBack={() => {
              setCurrentView(AppView.SURVEY_LIST);
            }}
          />
        ) : (
          <SurveyList onSelect={handleSurveySelect} />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default MainClient;
