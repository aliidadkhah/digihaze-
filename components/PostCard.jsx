"use client";

import Link from "next/link";
import { ImageOff, Calendar } from "lucide-react";

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

export default function PostCard({ post, basePath }) {
  return (
    <Link
      href={`${basePath}/${post.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        border: "1px solid var(--surface2)",
        borderRadius: 18,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        height: "100%",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      className="post-card"
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/10",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageOff size={26} color="var(--text-faint)" />
          </div>
        )}

        {post.category && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "var(--ink)",
              color: "#2F86FF",
              fontSize: 11,
              fontWeight: 800,
              borderRadius: 999,
              padding: "4px 12px",
              fontFamily: "Vazirmatn",
            }}
          >
            {post.category}
          </span>
        )}
      </div>

      <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          style={{
            fontFamily: "Vazirmatn",
            fontWeight: 800,
            fontSize: 15.5,
            lineHeight: 1.5,
            color: "var(--text-hi)",
            marginBottom: 8,
          }}
        >
          {post.title}
        </h3>

        {post.excerpt && (
          <p
            style={{
              color: "var(--text-mut)",
              fontSize: 13,
              lineHeight: 1.8,
              marginBottom: 12,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-faint)",
            fontSize: 11.5,
            fontFamily: "Vazirmatn",
          }}
        >
          <Calendar size={13} />
          {formatDate(post.createdAt)}
        </div>
      </div>

      <style jsx>{`
        .post-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -14px rgba(47, 134, 255, 0.25);
        }
      `}</style>
    </Link>
  );
}
