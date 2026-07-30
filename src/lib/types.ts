import type { AwardCategoryId } from "./touchstones";

export type HotelSeed = {
  name: string;
  state: string | null;
  country: string | null;
};

export type TouchstoneAnswerInput = {
  touchstone_key: string;
  not_applicable: boolean;
  answer_text: string;
};

export type SupportingFile = {
  name: string;
  mime: string;
  size: number;
  /** base64 without data: prefix */
  data_base64: string;
  kind: "image" | "document";
};

export type NominationPayload = {
  hotel_name: string;
  hotel_not_listed: boolean;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  award_category: AwardCategoryId;
  nominee_name?: string;
  nominee_role?: string;
  /** Lightkeeper narrative fields */
  lightkeeper_why?: string;
  lightkeeper_accomplishments?: string;
  lightkeeper_achievements?: string;
  lightkeeper_pushing_for?: string;
  signature_story?: string;
  sustainability_lead?: string;
  evidence_url?: string;
  supporting_files?: SupportingFile[];
  consent: boolean;
  answers: TouchstoneAnswerInput[];
  website_honeypot?: string;
};

export type NominationRecord = NominationPayload & {
  id: string;
  created_at: string;
  status: "submitted" | "shortlisted" | "winner" | "withdrawn";
  source: string;
};
