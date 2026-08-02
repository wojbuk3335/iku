"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateBio(bio: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Musisz być zalogowany.");

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio.trim() || null })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}

export async function updateFullName(fullName: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Musisz być zalogowany.");

  const trimmed = fullName.trim();
  if (!trimmed) throw new Error("Imię nie może być puste.");
  if (trimmed.length > 50) throw new Error("Imię może mieć maksymalnie 50 znaków.");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}

export async function updateLocation(input: {
  location: string;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
} | string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Musisz być zalogowany.");

  // Wsteczna kompatybilność: sam string
  const payload =
    typeof input === "string"
      ? {
          location: input.trim() || null,
          location_name: null as string | null,
          latitude: null as number | null,
          longitude: null as number | null,
          place_id: null as string | null,
        }
      : {
          location: input.location.trim() || null,
          location_name: input.locationName?.trim() || null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          place_id: input.placeId ?? null,
        };

  if (payload.location && payload.location.length > 120) {
    throw new Error("Lokalizacja może mieć maksymalnie 120 znaków.");
  }

  if (payload.location && (payload.latitude == null || payload.longitude == null)) {
    throw new Error("Wybierz lokalizację z listy podpowiedzi Google.");
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  if (error) {
    // Fallback gdy brak kolumn coords (migracja 036)
    if (
      error.message.includes("location_name") ||
      error.message.includes("latitude") ||
      error.message.includes("longitude") ||
      error.message.includes("place_id")
    ) {
      const { error: fallbackError } = await supabase
        .from("profiles")
        .update({ location: payload.location })
        .eq("id", user.id);
      if (fallbackError) throw new Error(fallbackError.message);
    } else {
      throw new Error(error.message);
    }
  }

  revalidatePath("/profile");
}

export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Musisz być zalogowany.");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}
