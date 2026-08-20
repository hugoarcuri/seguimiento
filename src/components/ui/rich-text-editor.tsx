"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { Bold, Underline as UnderlineIcon, Minus, Plus, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

function getCurrentFontSize(editor: ReturnType<typeof useEditor>): string {
  if (!editor) return "16px";
  const attrs = editor.getAttributes("textStyle");
  return attrs.fontSize || "16px";
}

function cycleFontSize(editor: ReturnType<typeof useEditor>, direction: "up" | "down") {
  if (!editor) return;
  const current = getCurrentFontSize(editor);
  const idx = FONT_SIZES.indexOf(current);
  if (direction === "up" && idx < FONT_SIZES.length - 1) {
    editor.chain().focus().setFontSize(FONT_SIZES[idx + 1]).run();
  } else if (direction === "down" && idx > 0) {
    editor.chain().focus().setFontSize(FONT_SIZES[idx - 1]).run();
  }
}

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      TextStyle,
      FontSize,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[80px] px-3 py-2 focus:outline-none",
      },
    },
  });

  const fontSize = getCurrentFontSize(editor);

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      {editor && (
        <div className="flex items-center gap-0.5 border-b px-2 py-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "rounded p-1.5 hover:bg-accent transition-colors",
              editor.isActive("bold") && "bg-accent text-foreground"
            )}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "rounded p-1.5 hover:bg-accent transition-colors",
              editor.isActive("underline") && "bg-accent text-foreground"
            )}
            title="Subrayado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          <button
            type="button"
            onClick={() => cycleFontSize(editor, "down")}
            className="rounded p-1.5 hover:bg-accent transition-colors"
            title="Achicar texto"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground min-w-[60px] justify-center">
            <Type className="h-3 w-3" />
            {fontSize.replace("px", "")}
          </div>

          <button
            type="button"
            onClick={() => cycleFontSize(editor, "up")}
            className="rounded p-1.5 hover:bg-accent transition-colors"
            title="Agrandar texto"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
