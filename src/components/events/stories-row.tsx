"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createStory,
  markStoriesViewed,
  type StoryAuthorGroup,
} from "@/app/stories/actions";

type StoriesRowProps = {
  initialGroups: StoryAuthorGroup[];
  currentUserId: string;
};

function initialsFrom(group: StoryAuthorGroup): string {
  if (group.fullName?.trim()) {
    return group.fullName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (group.email ?? "?").slice(0, 2).toUpperCase();
}

function labelFrom(group: StoryAuthorGroup): string {
  if (group.isSelf) return "Twoja relacja";
  if (group.fullName?.trim()) return group.fullName.split(" ")[0];
  return group.email?.split("@")[0] ?? "User";
}

export function StoriesRow({ initialGroups, currentUserId }: StoriesRowProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const activeGroup = viewerIndex !== null ? groups[viewerIndex] : null;
  const activeStory = activeGroup?.stories[storyIndex] ?? null;

  function openGroup(index: number) {
    const group = groups[index];
    if (!group) return;

    if (group.isSelf && group.stories.length === 0) {
      setCreating(true);
      return;
    }

    if (group.stories.length === 0) return;

    setViewerIndex(index);
    setStoryIndex(0);
    setProgress(0);
  }

  function openCreate(e?: React.MouseEvent) {
    e?.stopPropagation();
    setCreating(true);
  }

  function closeViewer() {
    if (progressRef.current) clearInterval(progressRef.current);
    setViewerIndex(null);
    setStoryIndex(0);
    setProgress(0);
  }

  function goNext() {
    if (!activeGroup) return;
    if (storyIndex < activeGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
      return;
    }
    // next author with stories
    if (viewerIndex === null) return;
    for (let i = viewerIndex + 1; i < groups.length; i++) {
      if (groups[i].stories.length > 0) {
        setViewerIndex(i);
        setStoryIndex(0);
        setProgress(0);
        return;
      }
    }
    closeViewer();
  }

  function goPrev() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
      return;
    }
    if (viewerIndex === null) return;
    for (let i = viewerIndex - 1; i >= 0; i--) {
      if (groups[i].stories.length > 0) {
        setViewerIndex(i);
        setStoryIndex(groups[i].stories.length - 1);
        setProgress(0);
        return;
      }
    }
  }

  useEffect(() => {
    if (!activeStory || !activeGroup) return;

    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);

    const duration = 5000;
    const step = 50;
    let elapsed = 0;

    progressRef.current = setInterval(() => {
      elapsed += step;
      setProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed >= duration) {
        if (progressRef.current) clearInterval(progressRef.current);
        goNext();
      }
    }, step);

    // Mark viewed (not own)
    if (!activeGroup.isSelf) {
      startTransition(() => {
        void markStoriesViewed([activeStory.id]);
      });
      setGroups((prev) =>
        prev.map((g, i) => {
          if (i !== viewerIndex) return g;
          const viewedIds = new Set(
            g.stories.slice(0, storyIndex + 1).map((s) => s.id),
          );
          return {
            ...g,
            hasUnseen: g.stories.some((s) => !viewedIds.has(s.id)),
          };
        }),
      );
    }

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStory?.id, viewerIndex, storyIndex]);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      alert("Plik max 8 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setCreating(true);
  }

  async function handlePublish() {
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${currentUserId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("stories")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("stories").getPublicUrl(path);
      await createStory(data.publicUrl, caption);

      // Optimistic: refresh by reload for simplicity
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Nie udało się dodać relacji.");
      setUploading(false);
    }
  }

  return (
    <>
      <section className="border-b border-white/5 px-0 py-2">
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(groups.length === 0
            ? [{
                userId: currentUserId,
                fullName: null,
                avatarUrl: null,
                email: null,
                isSelf: true,
                hasUnseen: false,
                stories: [],
              } as StoryAuthorGroup]
            : groups
          ).map((group, index) => {
            const active = group.stories.length > 0;
            const ringClass = group.isSelf
              ? active
                ? "bg-gradient-to-br from-fuchsia-500 via-violet-500 to-blue-500"
                : "bg-zinc-700"
              : group.hasUnseen
                ? "bg-gradient-to-br from-fuchsia-500 via-violet-500 to-blue-500"
                : "bg-zinc-600";

            return (
              <button
                key={group.userId}
                type="button"
                onClick={() => openGroup(index)}
                className="flex shrink-0 cursor-pointer flex-col items-center gap-2"
              >
                <div className={`relative rounded-full p-[2.5px] ${ringClass}`}>
                  <div className="rounded-full bg-[#080810] p-[2px]">
                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                      {group.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={group.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-white">
                          {initialsFrom(group)}
                        </span>
                      )}
                      {group.isSelf && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={openCreate}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") openCreate();
                          }}
                          className="absolute bottom-0 right-0 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 border-[#080810] bg-blue-500 text-white"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="max-w-16 truncate text-[11px] text-zinc-400">
                  {labelFrom(group)}
                </span>
              </button>
            );
          })}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFilePick}
        />
      </section>

      {/* Create story */}
      {creating && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0f0f18] p-4 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Nowa relacja</h3>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setFile(null);
                  setPreview(null);
                  setCaption("");
                }}
                className="cursor-pointer text-zinc-400 hover:text-white"
              >
                Zamknij
              </button>
            </div>

            {!preview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-zinc-400 hover:bg-white/10"
              >
                <span className="text-2xl">📷</span>
                Wybierz zdjęcie
              </button>
            ) : (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt=""
                  className="max-h-72 w-full rounded-2xl object-cover"
                />
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={120}
                  placeholder="Dodaj podpis (opcjonalnie)"
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 cursor-pointer rounded-xl bg-white/10 py-2.5 text-sm text-zinc-300"
                  >
                    Zmień
                  </button>
                  <button
                    type="button"
                    disabled={uploading || isPending}
                    onClick={() => void handlePublish()}
                    className="flex-1 cursor-pointer rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {uploading ? "Wysyłanie…" : "Opublikuj"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Viewer */}
      {activeGroup && activeStory && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black">
          <div className="flex gap-1 px-3 pt-3">
            {activeGroup.stories.map((s, i) => (
              <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-white transition-[width] duration-75 ease-linear"
                  style={{
                    width:
                      i < storyIndex
                        ? "100%"
                        : i === storyIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-700">
              {activeGroup.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeGroup.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold">
                  {initialsFrom(activeGroup)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {activeGroup.fullName ?? labelFrom(activeGroup)}
              </p>
              <p className="text-[11px] text-zinc-400">
                {new Date(activeStory.createdAt).toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={closeViewer}
              className="cursor-pointer rounded-full p-2 text-white hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-2 pb-8">
            <button
              type="button"
              aria-label="Poprzednia"
              className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-pointer"
              onClick={goPrev}
            />
            <button
              type="button"
              aria-label="Następna"
              className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-pointer"
              onClick={goNext}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeStory.mediaUrl}
              alt=""
              className="max-h-full max-w-full rounded-xl object-contain"
            />
            {activeStory.caption && (
              <p className="absolute bottom-10 left-4 right-4 rounded-xl bg-black/50 px-3 py-2 text-center text-sm text-white backdrop-blur-sm">
                {activeStory.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
