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
          font-size: 15.5px;
          line-height: 2.05;
          color: var(--text-lo);
        }
        .post-content > *:first-child {
          margin-top: 0;
        }
        .post-content p {
          margin: 0 0 16px;
        }
        .post-content > p:first-of-type {
          color: var(--text-hi);
          font-size: 1.05em;
        }
        .post-content h1,
        .post-content h2,
        .post-content h3 {
          font-family: "Vazirmatn", sans-serif;
          font-weight: 800;
          color: var(--text-hi);
          line-height: 1.6;
          margin: 34px 0 16px;
          padding-right: 14px;
          border-right: 4px solid #2f86ff;
        }
        .post-content h1 { font-size: 22px; }
        .post-content h2 { font-size: 20px; }
        .post-content h3 { font-size: 18px; }
        .post-content strong,
        .post-content b {
          color: var(--text-hi);
          font-weight: 800;
        }
        .post-content ul,
        .post-content ol {
          list-style: none;
          margin: 0 0 18px;
          padding: 0;
        }
        .post-content li {
          position: relative;
          padding-right: 24px;
          margin-bottom: 10px;
          line-height: 1.95;
        }
        .post-content ul li::before {
          content: "";
          position: absolute;
          right: 4px;
          top: 0.75em;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2f86ff;
        }
        .post-content ol {
          counter-reset: pc-item;
        }
        .post-content ol li {
          counter-increment: pc-item;
        }
        .post-content ol li::before {
          content: counter(pc-item);
          position: absolute;
          right: -2px;
          top: 0.1em;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2f86ff22;
          color: #2f86ff;
          font-size: 10.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .post-content blockquote {
          position: relative;
          margin: 22px 0;
          padding: 14px 18px;
          background: rgba(47, 134, 255, 0.08);
          border-right: 4px solid #2f86ff;
          border-radius: 10px;
          color: var(--text-hi);
          font-size: 0.94em;
          line-height: 1.9;
        }
        .post-content blockquote p {
          margin: 0;
        }
        .post-content img {
          max-width: 100%;
          border-radius: 14px;
          margin: 22px auto;
          display: block;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
        }
        .post-content hr {
          border: none;
          border-top: 1px solid var(--surface2);
          margin: 32px 0;
        }
      `}</style>
    </main>
  );
}
