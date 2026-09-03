"use client";

import Link from "next/link";
import { Calendar, User, ArrowRight, Tag as TagIcon } from "lucide-react";
import PostCard from "./PostCard";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PostDetail({ post, basePath, backLabel, related = [] }) {
  return (
    <main dir="rtl" style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link
        href={basePath}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-mut)",
          fontSize: 13,
          fontFamily: "Vazirmatn",
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        <ArrowRight size={15} />
        {backLabel}
      </Link>

      {post.category && (
        <span
          style={{
            display: "inline-block",
            background: "#2F86FF18",
            color: "#2F86FF",
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 999,
            padding: "5px 14px",
            fontFamily: "Vazirmatn",
            marginBottom: 14,
          }}
        >
          {post.category}
        </span>
      )}

      <h1
        style={{
          fontFamily: "Vazirmatn",
          fontWeight: 800,
          fontSize: 26,
          lineHeight: 1.5,
          color: "var(--text-hi)",
          marginBottom: 14,
        }}
      >
        {post.title}
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
          color: "var(--text-faint)",
          fontSize: 12.5,
          fontFamily: "Vazirmatn",
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: "1px solid var(--surface2)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <User size={14} /> {post.author}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar size={14} /> {formatDate(post.createdAt)}
        </span>
      </div>

      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          style={{
            width: "100%",
            maxHeight: 420,
            objectFit: "cover",
            borderRadius: 16,
            marginBottom: 28,
          }}
        />
      )}

      <div
        className="post-content"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 30 }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "var(--surface2)",
                color: "var(--text-mut)",
                fontSize: 11.5,
                borderRadius: 999,
                padding: "5px 12px",
                fontFamily: "Vazirmatn",
              }}
            >
              <TagIcon size={11} /> {tag}
            </span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <div style={{ marginTop: 50 }}>
          <h2
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-hi)",
              marginBottom: 16,
            }}
          >
            مطالب مرتبط
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {related.map((p) => (
              <PostCard key={p.id} post={p} basePath={basePath} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .post-content {
          font-family: "Vazirmatn", sans-serif;
          font-size: 15px;
          line-height: 2;
          color: var(--text-hi);
        }
        .post-content img {
          max-width: 100%;
          border-radius: 12px;
          margin: 14px 0;
          display: block;
        }
        .post-content h3 {
          font-size: 18px;
          font-weight: 800;
          margin: 26px 0 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #2f86ff;
          display: inline-block;
        }
        .post-content ul {
          padding-inline-start: 22px;
          margin: 10px 0;
        }
        .post-content li {
          margin-bottom: 6px;
        }
        .post-content p {
          margin: 10px 0;
        }
      `}</style>
    </main>
  );
}
