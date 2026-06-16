import { INTEREST_CATEGORIES } from "@/types/interests";

export type EventCategory = (typeof INTEREST_CATEGORIES)[number]["id"];

export type EventStatus = "draft" | "published" | "cancelled";

export type Event = {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  starts_at: string;
  location: string;
  cover_url: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  category: EventCategory;
  starts_at: string;
  location: string;
  cover_url?: string;
  status?: EventStatus;
};
