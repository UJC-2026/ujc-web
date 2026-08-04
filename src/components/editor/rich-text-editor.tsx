"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ToolbarAction = {
  icon: typeof Bold;
  label: string;
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const ACTIONS: ToolbarAction[][] = [
  [
    {
      icon: Bold,
      label: "Tebal",
      isActive: (e) => e.isActive("bold"),
      run: (e) => e.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Miring",
      isActive: (e) => e.isActive("italic"),
      run: (e) => e.chain().focus().toggleItalic().run(),
    },
    {
      icon: Strikethrough,
      label: "Coret",
      isActive: (e) => e.isActive("strike"),
      run: (e) => e.chain().focus().toggleStrike().run(),
    },
    {
      icon: Code,
      label: "Kode",
      isActive: (e) => e.isActive("code"),
      run: (e) => e.chain().focus().toggleCode().run(),
    },
  ],
  [
    {
      icon: Heading2,
      label: "Subjudul",
      isActive: (e) => e.isActive("heading", { level: 2 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: List,
      label: "Daftar poin",
      isActive: (e) => e.isActive("bulletList"),
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Daftar bernomor",
      isActive: (e) => e.isActive("orderedList"),
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Kutipan",
      isActive: (e) => e.isActive("blockquote"),
      run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
  ],
  [
    {
      icon: Undo2,
      label: "Urungkan",
      run: (e) => e.chain().focus().undo().run(),
    },
    {
      icon: Redo2,
      label: "Ulangi",
      run: (e) => e.chain().focus().redo().run(),
    },
  ],
];

export function RichTextEditor({
  name,
  placeholder = "Tulis di sini…",
  initialContent = "",
  minHeight = "12rem",
}: {
  name: string;
  placeholder?: string;
  initialContent?: string;
  minHeight?: string;
}) {
  const [html, setHtml] = useState(initialContent);

  const editor = useEditor({
    // Tiptap renders on the client only; SSR would mismatch on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-ujc focus:outline-none",
        style: `min-height:${minHeight}`,
      },
    },
  });

  const addLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Alamat tautan (https://…)", previous ?? "https://");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      window.alert("Tautan harus diawali http://, https://, atau mailto:");
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="rounded-field border border-border bg-surface transition-colors focus-within:border-primary">
      <input type="hidden" name={name} value={html} />

      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        {ACTIONS.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-0.5">
            {groupIndex > 0 && (
              <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            )}
            {group.map((action) => {
              const active = editor ? action.isActive?.(editor) : false;
              return (
                <button
                  key={action.label}
                  type="button"
                  title={action.label}
                  aria-label={action.label}
                  aria-pressed={action.isActive ? active : undefined}
                  disabled={!editor}
                  onClick={() => editor && action.run(editor)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-[8px] transition-colors disabled:opacity-40",
                    active
                      ? "bg-surface-muted text-primary"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
                  )}
                >
                  <action.icon className="size-4" aria-hidden />
                </button>
              );
            })}
          </div>
        ))}

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          title="Tautan"
          aria-label="Tautan"
          aria-pressed={editor?.isActive("link") ?? false}
          disabled={!editor}
          onClick={addLink}
          className={cn(
            "flex size-8 items-center justify-center rounded-[8px] transition-colors disabled:opacity-40",
            editor?.isActive("link")
              ? "bg-surface-muted text-primary"
              : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
          )}
        >
          <Link2 className="size-4" aria-hidden />
        </button>
      </div>

      <EditorContent editor={editor} className="px-3.5 py-3" />
    </div>
  );
}
