"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/events/bottom-nav";
import {
  toggleReaction,
  getPostComments,
  createComment,
  type Post,
  type Comment,
} from "@/app/profile/wall-actions";
import { usernameFromEmail } from "@/lib/profile/username";

type PostDetailPageProps = {
  post: Post;
  currentUserId: string;
  currentUserName: string | null;
  currentUserAvatar: string | null;
  currentUserEmail: string;
};

function getInitials(email: string): string {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni temu`;
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PostDetailPage({
  post: initialPost,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserEmail,
}: PostDetailPageProps) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [copied, setCopied] = useState(false);

  const authorUsername =
    post.author_username ||
    usernameFromEmail(post.author_email, post.user_id);
  const authorName =
    post.author_name ||
    post.author_email.split("@")[0]?.replace(/[._-]/g, " ") ||
    authorUsername;
  const authorInitials = getInitials(post.author_email || authorUsername);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingComments(true);
      const list = await getPostComments(post.id);
      if (!cancelled) {
        setComments(list);
        setLoadingComments(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function handleReaction() {
    if (reacting) return;
    setReacting(true);
    const prev = post;
    setPost((p) => ({
      ...p,
      user_reacted: !p.user_reacted,
      reaction_count: p.user_reacted ? p.reaction_count - 1 : p.reaction_count + 1,
    }));
    try {
      await toggleReaction(post.id);
    } catch {
      setPost(prev);
      alert("Nie udało się zareagować.");
    } finally {
      setReacting(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: authorName });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // cancelled
    }
  }

  async function handleSubmitComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createComment(post.id, commentText);
      const newComment: Comment = {
        id: Date.now().toString(),
        post_id: post.id,
        user_id: currentUserId,
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        author_name: currentUserName,
        author_avatar: currentUserAvatar,
        author_email: currentUserEmail,
      };
      setComments((prev) => [...prev, newComment]);
      setPost((p) => ({ ...p, comment_count: p.comment_count + 1 }));
      setCommentText("");
    } catch {
      alert("Nie udało się dodać komentarza.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#080810] pb-28 text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-3 pt-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
          aria-label="Wróć"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <Link
          href={`/profile/${encodeURIComponent(authorUsername)}`}
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
            {post.author_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author_avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-700 text-[10px] font-bold">
                {authorInitials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{authorName}</p>
            <p className="truncate text-xs text-zinc-500">@{authorUsername}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Więcej"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </header>

      {/* Media */}
      {post.image_url ? (
        <div className="relative aspect-square w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt="" className="h-full w-full object-cover" />
          {(post.event_location || post.event_title) && (
            <div className="absolute bottom-3 left-3 flex max-w-[85%] items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0 text-violet-300">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">{post.event_location || post.event_title}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="border-y border-white/5 bg-[#0f0f18] px-4 py-8">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
            {post.content}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 pt-3">
        <button
          type="button"
          onClick={() => void handleReaction()}
          disabled={reacting}
          className={`flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-colors ${
            post.user_reacted ? "text-rose-400" : "text-zinc-300 hover:text-white"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={post.user_reacted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {post.reaction_count > 0 && <span className="tabular-nums">{post.reaction_count}</span>}
        </button>

        <a
          href="#comments"
          className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {post.comment_count > 0 && <span className="tabular-nums">{post.comment_count}</span>}
        </a>

        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:text-white"
          aria-label="Udostępnij"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => void handleShare()}
          className="ml-auto flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:text-white"
          aria-label="Udostępnij link"
          title={copied ? "Skopiowano" : "Udostępnij"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {copied && <span className="text-xs text-emerald-400">OK</span>}
        </button>
      </div>

      {/* Caption */}
      {post.image_url && post.content && (
        <div className="px-4 pt-2">
          <p className="text-sm leading-relaxed text-zinc-200">
            <Link
              href={`/profile/${encodeURIComponent(authorUsername)}`}
              className="font-semibold text-white hover:underline"
            >
              {authorUsername}
            </Link>{" "}
            {post.content}
          </p>
        </div>
      )}
      {!post.image_url && null}

      <p className="px-4 pt-1.5 text-xs text-zinc-600">{formatRelativeTime(post.created_at)}</p>

      {/* Comments */}
      <section id="comments" className="mt-5 border-t border-white/10 px-4 pt-4">
        <h2 className="mb-3 text-sm font-semibold text-white">
          Komentarze ({post.comment_count})
        </h2>

        {loadingComments ? (
          <p className="py-6 text-center text-sm text-zinc-600">Ładowanie…</p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-600">Brak komentarzy. Napisz pierwszy!</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => {
              const cName =
                c.author_name ||
                c.author_email.split("@")[0]?.replace(/[._-]/g, " ") ||
                "Użytkownik";
              const cInitials = getInitials(c.author_email || cName);
              return (
                <li key={c.id} className="flex gap-2.5">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
                    {c.author_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.author_avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 text-[9px] font-bold">
                        {cInitials}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200">
                      <span className="font-semibold text-white">{cName}</span>{" "}
                      {c.content}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      {formatRelativeTime(c.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
            {currentUserAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUserAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-purple-700 text-[9px] font-bold">
                {getInitials(currentUserEmail)}
              </div>
            )}
          </div>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmitComment();
            }}
            placeholder="Dodaj komentarz…"
            maxLength={300}
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSubmitComment()}
            disabled={!commentText.trim() || submitting}
            className="shrink-0 text-sm font-semibold text-violet-400 disabled:opacity-40"
          >
            {submitting ? "…" : "Opublikuj"}
          </button>
        </div>
      </section>

      <BottomNav activePage="profile" />
    </div>
  );
}
