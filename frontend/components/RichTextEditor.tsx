"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[160px] p-3",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // sync external value -> editor (when selecting different product)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", false);
  }, [value, editor]);

  if (!editor) {
    return <div className="rounded-xl border p-3 text-sm text-zinc-500">Loading editor…</div>;
  }

  const Btn = ({ label, onClick, active }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-2 py-1 rounded-lg border text-xs " +
        (active ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-zinc-50">
        <Btn label="B" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <Btn label="I" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <Btn label="U" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <Btn label="• list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <Btn label="1. list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <Btn label="Link" active={editor.isActive("link")} onClick={() => {
          const url = window.prompt("URL:");
          if (!url) return;
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }} />
        <Btn label="Unlink" active={false} onClick={() => editor.chain().focus().unsetLink().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
