"use client";

import { useRef, useEffect } from "react";
import { Bold, Heading2, List, ImagePlus } from "lucide-react";
import { uploadProductImage } from "@/lib/productImages";

const btnStyle = {
  background: "var(--surface2)",
  border: "none",
  borderRadius: 6,
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--text-hi)",
  flexShrink: 0,
};

export default function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!loadedOnce.current && ref.current) {
      ref.current.innerHTML = value || "";
      loadedOnce.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current.innerHTML);
  };

  const insertImage = async (file) => {
    if (!file) return;
    try {
      const url = await uploadProductImage(file);
      if (url) exec("insertImage", url);
    } catch {
      // آپلود ناموفق - بی‌صدا رد می‌شه، کاربر می‌تونه دوباره امتحان کنه
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          title="ضخیم"
          style={btnStyle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          title="عنوان"
          style={btnStyle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("formatBlock", "H3")}
        >
          <Heading2 size={14} />
        </button>
        <button
          type="button"
          title="لیست"
          style={btnStyle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("insertUnorderedList")}
        >
          <List size={14} />
        </button>
        <label style={{ ...btnStyle, cursor: "pointer" }} title="افزودن عکس">
          <ImagePlus size={14} />
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => insertImage(e.target.files?.[0])}
          />
        </label>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        className="rte-editable"
        style={{
          minHeight: 120,
          background: "var(--bg)",
          border: "1px solid var(--surface2)",
          borderRadius: 10,
          padding: "10px 12px",
          fontFamily: "Vazirmatn",
          fontSize: 13.5,
          color: "var(--text-hi)",
          outline: "none",
          lineHeight: 1.9,
          overflowY: "auto",
          maxHeight: 280,
        }}
      />

      <style jsx>{`
        .rte-editable :global(img) {
          max-width: 100%;
          border-radius: 10px;
          margin: 8px 0;
          display: block;
        }
        .rte-editable :global(h3) {
          font-size: 15px;
          font-weight: 800;
          margin: 10px 0 6px;
        }
        .rte-editable :global(ul) {
          padding-inline-start: 20px;
        }
        .rte-editable:empty:before {
          content: attr(data-placeholder);
          color: var(--text-faint);
        }
      `}</style>
    </div>
  );
}
