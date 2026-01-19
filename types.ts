export enum AppView {
  LOGIN = "LOGIN",
  SIGNUP = "SIGNUP",
  DASHBOARD = "DASHBOARD",
  SURVEY_LIST = "SURVEY_LIST",
  SURVEY_DETAIL = "SURVEY_DETAIL",
  LAND_CHANGES = "LAND_CHANGES",
  LAND_CHANGE_DETAIL = "LAND_CHANGE_DETAIL",
  CIVIL_REQUESTS = "CIVIL_REQUESTS",
  PROFILE = "PROFILE",
}

export interface PersonInfo {
  name: string;
  address: string;
  phone: string;
  birthDate: string;
  gender: "남" | "여";
  relationship?: string;
  description?: string;
}

export interface SurveySubRecord {
  id: string;
  category: string;
  totalArea: number;
  cultivationArea: number;
  status: string;
  cultivator: string;
  hasFacility: boolean;
  type: string;
  varietyName: string;
  plantingYear: string;
  installYear: string;
  treeAge: number;
  treeCount: number;
  spacing: string;
  isHeated: boolean;
  otherType: string;
  nonCultivationDetail: string;
  recordedAt: string;
}

export interface SurveyRecord {
  id: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  variety: string;
  area: number;
  status: "completed" | "pending" | "updated";
  surveyDate: string;
  coordinates: { lat: number; lng: number };
  boundary?: number[][]; // [lng, lat][]
  ownerInfo?: PersonInfo;
  respondentInfo?: PersonInfo;
  subRecords?: SurveySubRecord[];
}

export interface LandChange {
  id: string;
  type: "new" | "modify" | "delete";
  address: string;
  changeDate: string;
  details: string;
  coordinates: { lat: number; lng: number };
  boundary?: number[][]; // [lng, lat][]
  area: number;
}

export interface CivilRequest {
  id: string;
  type: "new" | "modify";
  requestDate: string;
  requester: string;
  requesterPhone: string;
  address: string;
  status: "received" | "processing" | "done";
  details: string;
  coordinates: { lat: number; lng: number };
  boundary?: number[][]; // [lng, lat][]
  area: number;
}
