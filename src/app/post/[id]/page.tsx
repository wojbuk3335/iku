import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getPostById, getPostTaggedUsers, isPostSaved } from "@/app/profile/wall-actions";
import { PostDetailPage } from "@/components/profile/post-detail-page";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const post = await getPostById(id);
  if (!post) {
    notFound();
  }

  const [taggedUsers, initiallySaved] = await Promise.all([
    getPostTaggedUsers(id),
    isPostSaved(id),
  ]);

  return (
    <PostDetailPage
      post={post}
      taggedUsers={taggedUsers}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? null}
      currentUserAvatar={profile?.avatar_url ?? null}
      currentUserEmail={user.email ?? profile?.email ?? ""}
      initiallySaved={initiallySaved}
    />
  );
}
