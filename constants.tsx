import { SurveyRecord, LandChange, CivilRequest } from "./types";

// 제주도 남원읍 실제 감귤 농장 추정 위치 및 경계 데이터
// 1. 하례리 감귤농장 (불규칙한 다각형)
const boundary1 = [
  [126.6358, 33.2785],
  [126.6362, 33.2785],
  [126.6365, 33.2782],
  [126.6368, 33.2778],
  [126.6362, 33.2775],
  [126.6355, 33.2778],
  [126.6358, 33.2785],
];

// 2. 신례리 농장 (세로로 긴 형태)
const boundary2 = [
  [126.6521, 33.2865],
  [126.6528, 33.2862],
  [126.6525, 33.2855],
  [126.6518, 33.2858],
  [126.6521, 33.2865],
];

// 3. 위미리 농장 (복잡한 형태)
const boundary3 = [
  [126.6631, 33.2798],
  [126.6638, 33.2798],
  [126.6642, 33.2792],
  [126.6635, 33.2788],
  [126.6628, 33.2792],
  [126.6631, 33.2798],
];

// 4. 남원리 농장 (거의 사각형)
const boundary4 = [
  [126.7142, 33.2815],
  [126.715, 33.2815],
  [126.715, 33.2808],
  [126.7142, 33.2808],
  [126.7142, 33.2815],
];

export const MOCK_SURVEYS: SurveyRecord[] = [
  {
    id: "s-1",
    address: "제주특별자치도 서귀포시 남원읍 하례리 123-1",
    ownerName: "김철수",
    ownerPhone: "010-1234-5678",
    variety: "온주밀감-극조생-일남1호",
    area: 2340,
    status: "completed",
    surveyDate: "2024-03-15",
    coordinates: { lat: 33.278, lng: 126.636 }, // 하례리 실제 좌표 근처
    boundary: boundary1,
    ownerInfo: {
      name: "김철수",
      address: "서귀포시 남원읍 하례로 123",
      phone: "010-1234-5678",
      birthDate: "1965-05-20",
      gender: "남",
    },
    respondentInfo: {
      name: "이영희",
      address: "서귀포시 남원읍 하례로 123",
      phone: "010-9876-5432",
      birthDate: "1970-08-15",
      gender: "여",
      relationship: "배우자",
    },
    subRecords: [
      {
        id: "sub-1",
        category: "과수원",
        totalArea: 2340,
        cultivationArea: 2300,
        status: "정상경작",
        cultivator: "본인",
        hasFacility: false,
        type: "노지",
        varietyName: "일남1호",
        plantingYear: "2005",
        installYear: "2005",
        treeAge: 19,
        treeCount: 300,
        spacing: "3m",
        isHeated: false,
        otherType: "해당없음",
        nonCultivationDetail: "-",
        recordedAt: "2024-03-15",
      },
    ],
  },
  {
    id: "s-2",
    address: "제주특별자치도 서귀포시 남원읍 신례리 45-2",
    ownerName: "박영희",
    ownerPhone: "010-9876-5432",
    variety: "한라봉",
    area: 1500,
    status: "pending",
    surveyDate: "2024-03-18",
    coordinates: { lat: 33.286, lng: 126.652 }, // 신례리
    boundary: boundary2,
  },
  {
    id: "s-3",
    address: "제주특별자치도 서귀포시 남원읍 위미리 789",
    ownerName: "최민수",
    ownerPhone: "010-5555-7777",
    variety: "천혜향",
    area: 3300,
    status: "updated",
    surveyDate: "2024-03-10",
    coordinates: { lat: 33.279, lng: 126.6635 }, // 위미리
    boundary: boundary3,
  },
  {
    id: "s-4",
    address: "제주특별자치도 서귀포시 남원읍 남원리 1004",
    ownerName: "정지훈",
    ownerPhone: "010-3333-2222",
    variety: "레드향",
    area: 1800,
    status: "completed",
    surveyDate: "2024-03-01",
    coordinates: { lat: 33.281, lng: 126.7145 }, // 남원리
    boundary: boundary4,
  },
];

export const MOCK_LAND_CHANGES: LandChange[] = [
  {
    id: "lc-1",
    type: "new",
    address: "서귀포시 남원읍 하례리 122-2",
    changeDate: "2024-03-10",
    details: "토지 분할에 따른 신규 지번 생성",
    coordinates: { lat: 33.2785, lng: 126.635 }, // 하례리 근처
    boundary: [
      [126.6345, 33.279],
      [126.6355, 33.279],
      [126.6355, 33.278],
      [126.6345, 33.278],
      [126.6345, 33.279],
    ],
    area: 850,
  },
  {
    id: "lc-2",
    type: "modify",
    address: "서귀포시 남원읍 위미리 56-7",
    changeDate: "2024-02-28",
    details: "지목 변경 (전 -> 과수원)",
    coordinates: { lat: 33.28, lng: 126.664 }, // 위미리
    boundary: boundary3, // 위미리 예시 경계 재사용
    area: 1200,
  },
  {
    id: "lc-3",
    type: "delete",
    address: "서귀포시 남원읍 신례리 99-1",
    changeDate: "2024-02-15",
    details: "도로 편입으로 인한 말소",
    coordinates: { lat: 33.287, lng: 126.653 }, // 신례리
    area: 300,
  },
];

export const MOCK_CIVIL_REQUESTS: CivilRequest[] = [
  {
    id: "cr-1",
    type: "modify",
    requestDate: "2024-03-05",
    requester: "강철수",
    requesterPhone: "010-2233-4455",
    address: "서귀포시 남원읍 하례리 150-1",
    status: "received",
    details: "실제 경작지 면적이 공부상 면적과 다름에 따른 수정 요청",
    coordinates: { lat: 33.277, lng: 126.637 }, // 하례리 실제 농장 근처
    boundary: [
      [126.6365, 33.2775],
      [126.6375, 33.2775],
      [126.6378, 33.2768],
      [126.6368, 33.2765],
      [126.6365, 33.2775],
    ],
    area: 1540,
  },
  {
    id: "cr-2",
    type: "new",
    requestDate: "2024-03-04",
    requester: "김영희",
    requesterPhone: "010-8877-6655",
    address: "서귀포시 남원읍 신례리 888-2",
    status: "processing",
    details: "과수원 신규 개간에 따른 대장 등록 요청",
    coordinates: { lat: 33.285, lng: 126.651 }, // 신례리 농장지대
    boundary: [
      [126.6505, 33.2855],
      [126.6515, 33.2855],
      [126.6515, 33.2845],
      [126.6505, 33.2845],
      [126.6505, 33.2855],
    ],
    area: 2100,
  },
  {
    id: "cr-3",
    type: "modify",
    requestDate: "2024-03-02",
    requester: "이정호",
    requesterPhone: "010-4499-1122",
    address: "서귀포시 남원읍 남원리 13-10",
    status: "done",
    details: "품종 갱신(일남1호 -> 한라봉)에 따른 정보 변경 요청",
    coordinates: { lat: 33.281, lng: 126.714 }, // 남원리
    boundary: boundary4,
    area: 980,
  },
];
