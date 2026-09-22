"use client";

import { useRef, useEffect } from "react";
import { Bold, Heading2, List, ImagePlus, Highlighter, Quote, Link2, Unlink } from "lucide-react";
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

  // لینک‌دادن به متنِ انتخاب‌شده (مثلاً وسط یک پاراگراف، لینک به یک محصول)
  // برای لینک به محصول کافیه آدرسی مثل /product/اسلاگ-محصول وارد بشه،
  // یا یک آدرس کامل https://... برای لینک‌های بیرونی
  const insertLink = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      alert("اول متنی که می‌خواهید لینک بشه رو انتخاب کنید (سلکت کنید)، بعد روی این دکمه بزنید.");
      return;
    }
    if (!ref.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) return;

    saveSelection();

    const url = window.prompt(
      "آدرس لینک رو وارد کنید — برای لینک به یک محصول: /product/اسلاگ-محصول ، یا یک آدرس کامل مثل https://..."
    );
    if (!url) return;

    ref.current?.focus();
    restoreSelection();
    document.execCommand("createLink", false, url);

    // execCommand("createLink") خودش target/rel رو تنظیم نمی‌کند؛
    // برای لینک‌های بیرونی بهتره در تب جدید باز بشه
    if (/^https?:\/\//i.test(url)) {
      const sel2 = window.getSelection();
      const anchor =
        sel2?.anchorNode?.parentElement?.closest?.("a") ||
        sel2?.focusNode?.parentElement?.closest?.("a");
      if (anchor) {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      }
    }

    saveSelection();
    onChange(ref.current.innerHTML);
  };

  // حذف لینک از متنِ انتخاب‌شده (مکان‌نما باید داخل یک لینک باشه)
  const removeLink = () => {
    exec("unlink");
  };

  // پس‌زمینه (کادر) پشت متنِ انتخاب‌شده اضافه می‌کند
  const highlightSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;

    const span = document.createElement("span");
    span.style.background = "#4F7FFF2E";
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
          title="لینک‌دادن به متن انتخاب‌شده (مثلاً لینک به یک محصول — اول متن رو انتخاب کن)"
          style={btnStyle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLink}
        >
          <Link2 size={14} />
        </button>
        <button
          type="button"
          title="حذف لینک (مکان‌نما باید روی یک لینک باشه)"
          style={btnStyle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={removeLink}
        >
          <Unlink size={14} />
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
        <button
          type="button"
          title="کادر نکته / هشدار (پاراگراف جاری رو تبدیل می‌کند)"
          style={btnStyle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("formatBlock", "BLOCKQUOTE")}
        >
          <Quote size={14} />
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
          fontFamily: "var(--font-primary)",
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

      <style>{`
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
          padding-right: 10px;
          border-right: 3px solid #4F7FFF;
        }
        .rte-editable :global(ul) {
          padding-inline-start: 20px;
        }
        .rte-editable :global(a) {
          color: #4F7FFF;
          text-decoration: underline;
        }
        .rte-editable :global(blockquote) {
          margin: 10px 0;
          padding: 10px 14px;
          background: #4F7FFF14;
          border-right: 3px solid #4F7FFF;
          border-radius: 8px;
        }
        .rte-editable:empty:before {
          content: attr(data-placeholder);
          color: var(--text-faint);
        }
      `}</style>
    </div>
  );
}
