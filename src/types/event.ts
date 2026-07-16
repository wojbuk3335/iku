import { INTEREST_CATEGORIES } from "@/types/interests";

export type EventCategory = (typeof INTEREST_CATEGORIES)[number]["id"];

export type EventStatus = "draft" | "published" | "cancelled";

export type EventRecurrence = "one_time" | "recurring";

export type Event = {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  categories: EventCategory[];
  recurrence: EventRecurrence;
  starts_at: string;
  ends_at: string;
  location: string;
  location_name?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  categories: EventCategory[];
  recurrence?: EventRecurrence;
  starts_at: string;
  ends_at: string;
  location: string;
  location_name?: string | null;
  place_id?: string | null;
  latitude: number;
  longitude: number;
  cover_url?: string;
  status?: EventStatus;
};
