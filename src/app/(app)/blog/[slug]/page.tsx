import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getComments, getPostBySlug, hasLiked } from "@/lib/blog/queries";
import { getCurrentProfile, getPengurusRoles } from "@/lib/auth/session";
import { RichText } from "@/components/editor/rich-text";
import { LikeButton } from "@/components/blog/like-button";
import { CommentSection } from "@/components/blog/comment-section";
import { PublishControl } from "@/components/blog/publish-control";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateID } from "@/lib/format";
import { richTextToPlain } from "@/lib/sanitize";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Artikel tidak ditemukan" };

  // An unpublished draft must not be advertised through metadata.
  if (post.status !== "terbit") {
    return { title: "Artikel belum terbit", robots: { index: false } };
  }

  const description = richTextToPlain(post.content, 155);

  return {
    title: post.title,
    description,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      authors: post.author ? [post.author.full_name] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const [post, profile] = await Promise.all([
    getPostBySlug(slug),
    getCurrentProfile(),
  ]);

  // RLS hides other people's unpublished drafts entirely.
  if (!post) notFound();

  const [comments, liked, roles] = await Promise.all([
    getComments(post.id),
    profile ? hasLiked(post.id, profile.id) : Promise.resolve(false),
    profile ? getPengurusRoles(profile.id) : Promise.resolve([]),
  ]);

  const canPublish =
    roles.length > 0 || profile?.role === "admin" || profile?.role === "moderator";

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/blog" className="transition-colors hover:text-primary">
          Blog komunitas
        </Link>
      </nav>

      {post.status !== "terbit" && (
        <p className="mt-5 rounded-panel border border-danger/40 bg-danger/8 px-4 py-3.5 text-caption text-foreground">
          Artikel ini belum terbit. Hanya kamu sebagai penulis dan pengurus yang
          bisa membukanya.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {post.category && <Badge variant="outline">{post.category}</Badge>}
      </div>

      <h1 className="mt-3 text-h1 text-foreground">{post.title}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Avatar
          src={post.author?.avatar_url}
          name={post.author?.full_name ?? "Anggota"}
          size="md"
        />
        <div>
          <Link
            href={`/members/${post.author_id}`}
            className="text-caption font-medium text-foreground transition-colors hover:text-primary"
          >
            {post.author?.full_name ?? "Anggota UJC"}
          </Link>
          <p className="text-caption text-muted-foreground">
            {formatDateID(post.published_at ?? post.created_at)}
          </p>
        </div>
      </div>

      <RichText html={post.content} className="mt-8" />

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <LikeButton
          postId={post.id}
          slug={post.slug}
          liked={liked}
          count={post.likeCount}
          canLike={Boolean(profile)}
        />
        {canPublish && <PublishControl postId={post.id} status={post.status} />}
      </div>

      <CommentSection
        postId={post.id}
        slug={post.slug}
        comments={comments}
        canComment={Boolean(profile)}
      />
    </article>
  );
}
