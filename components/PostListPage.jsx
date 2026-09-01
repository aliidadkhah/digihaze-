import { Newspaper } from "lucide-react";
import PostCard from "./PostCard";

export default function PostListPage({ title, description, posts, basePath }) {
  return (
    <main dir="rtl" aria-labelledby="posts-page-title">
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 20px 0" }}>
        <h1
          id="posts-page-title"
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 28,
            color: "var(--text-hi)",
            marginBottom: 8,
          }}
        >
          {title}
        </h1>
        {description && (
          <p style={{ color: "var(--text-mut)", fontSize: 14, lineHeight: 1.9, maxWidth: 640 }}>
            {description}
          </p>
        )}
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 70px" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--text-mut)" }}>
            <Newspaper size={36} color="var(--text-faint)" style={{ margin: "0 auto 14px" }} />
            <p style={{ fontSize: 14, fontFamily: "Vazirmatn" }}>هنوز مطلبی منتشر نشده.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {posts.map((post) => (
              <PostCard key={post.id} post={post} basePath={basePath} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
