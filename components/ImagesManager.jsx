"use client";

import { useState } from "react";
import { UploadCloud, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { IMAGES_BUCKET, filenameFromPath } from "@/lib/images";
import { IMAGE_SLOTS } from "@/lib/imageSlots";
import SiteImage from "./SiteImage";

export default function ImagesManager() {
  const [busyKey, setBusyKey] = useState(null);
  const [doneKey, setDoneKey] = useState(null);
  const [errorKey, setErrorKey] = useState(null);
  const [bump, setBump] = useState(0); // برای رفرش پیش‌نمایش‌ها بعد از آپلود

  const upload = async (path, file) => {
    if (!file) return;
    const filename = filenameFromPath(path);
    setBusyKey(path);
    setErrorKey(null);
    setDoneKey(null);

    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(filename, file, {
        upsert: true,
        cacheControl: "60",
        contentType: file.type || "image/jpeg",
      });

    setBusyKey(null);
    if (error) {
      setErrorKey(path);
      console.error("Upload error:", error);
      return;
    }
    setDoneKey(path);
    setBump((b) => b + 1);
    setTimeout(() => setDoneKey(null), 2500);
  };

  const groups = IMAGE_SLOTS.reduce((acc, slot) => {
    (acc[slot.group] ||= []).push(slot);
    return acc;
  }, {});

  return (
    <div>
      <p
        style={{
          color: "var(--text-mut)",
          fontSize: 13,
          lineHeight: 1.9,
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        روی هر عکس بزن، یه فایل جدید انتخاب کن، جایگزین می‌شه. تغییرات معمولا تا حدود
        ۱ دقیقه روی سایت (برای بازدیدکننده‌ها) دیده می‌شه، چون عکس‌ها کش می‌شن.
      </p>

      {Object.entries(groups).map(([groupName, slots]) => (
        <div key={groupName} style={{ marginBottom: 26 }}>
          <h3
            style={{
              fontFamily: "Vazirmatn",
              fontWeight: 800,
              fontSize: 15,
              marginBottom: 12,
              color: "var(--text-hi)",
            }}
          >
            {groupName}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 14,
            }}
          >
            {slots.map((slot) => {
              const inputId = `img-upload-${filenameFromPath(slot.path)}`;
              const busy = busyKey === slot.path;
              const done = doneKey === slot.path;
              const failed = errorKey === slot.path;

              return (
                <label
                  key={slot.path}
                  htmlFor={inputId}
                  style={{
                    cursor: "pointer",
                    background: "var(--surface)",
                    border: `1px solid ${failed ? "#E53935" : "var(--surface2)"}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "1/1",
                      background: "var(--bg)",
                    }}
                  >
                    <SiteImage
                      key={slot.path + bump}
                      src={slot.path}
                      alt={slot.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.45)",
                        opacity: busy || done ? 1 : 0,
                        transition: "opacity .15s",
                      }}
                    >
                      {busy && <Loader2 size={22} color="#fff" className="spin" />}
                      {done && <Check size={22} color="#22E5C9" />}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "var(--text-hi)",
                    }}
                  >
                    <UploadCloud size={13} style={{ flexShrink: 0 }} />
                    <span>{slot.label}</span>
                  </div>

                  {failed && (
                    <div style={{ padding: "0 10px 8px", fontSize: 11, color: "#E53935" }}>
                      آپلود ناموفق بود، دوباره امتحان کن
                    </div>
                  )}

                  <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => upload(slot.path, e.target.files?.[0])}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <style>{`
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
