"use client";

import { useRef, useEffect } from "react";
import { Bold, Heading2, List, ImagePlus, Highlighter } from "lucide-react";
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
  const savedRange = useRef(null);

  useEffect(() => {
    if (!loadedOnce.current && ref.current) {
      ref.current.innerHTML = value || "";
      loadedOnce.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // موقعیت فعلی مکان‌نما رو ذخیره می‌کند تا بعد از یک عملیات async (مثل آپلود عکس) بشه برش گردوند
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (savedRange.current) {
      sel.addRange(savedRange.current);
    } else if (ref.current) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.addRange(range);
    }
  };

  const exec = (cmd, arg) => {
    ref.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false, arg);
    saveSelection();
    onChange(ref.current.innerHTML);
  };

  const insertImage = async (file) => {
    if (!file) return;
    saveSelection(); // قبل از باز شدن دیالوگ انتخاب فایل، مکان‌نما رو ذخیره کن
    try {
      const url = await uploadProductImage(file);
      if (url) {
        ref.current?.focus();
        restoreSelection();
        document.execCommand("insertImage", false, url);
        saveSelection();
        onChange(ref.current.innerHTML);
      }
    } catch {
      // آپلود ناموفق - بی‌صدا رد می‌شه، کاربر می‌تونه دوباره امتحان کنه
    }
  };

  // پس‌زمینه (کادر) پشت متنِ انتخاب‌شده اضافه می‌کند
  const highlightSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;

    const span = document.createElement("span");
    span.style.background = "#2F86FF2E";
    span.style.borderRadius = "6px";
    span.style.padding = "1px 6px";
    span.appendChild(range.extractContents());
    range.insertNode(span);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    sel.addRange(newRange);

    saveSelection();
    onChange(ref.current.innerHTML);
  };

  return (
    <div dir="rtl">
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
        <button
          type="button"
          title="کادر پس‌زمینه پشت متن انتخاب‌شده (اول متن رو انتخاب کن)"
          style={btnStyle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={highlightSelection}
        >
          <Highlighter size={14} />
        </button>
        <label style={{ ...btnStyle, cursor: "pointer" }} title="افزودن عکس در محل مکان‌نما">
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
        dir="rtl"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
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
          textAlign: "right",
          direction: "rtl",
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
          margin: 14px 0 8px;
          padding-bottom: 6px;
          border-bottom: 2px solid #2F86FF;
          display: inline-block;
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
