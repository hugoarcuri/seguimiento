"use client";

import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, FontSize, FontFamily, Color } from "@tiptap/extension-text-style";
import {
  Bold, Underline as UnderlineIcon, Italic, Highlighter,
  Minus, Plus, Type, List, ListOrdered, ChevronDown, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  defaultHeight?: number;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const FONT_FAMILIES = ["", "Arial", "Georgia", "Times New Roman", "Courier New", "Verdana"];

function getCurrentFontSize(editor: ReturnType<typeof useEditor>): string {
  if (!editor) return "16px";
  const attrs = editor.getAttributes("textStyle");
  return attrs.fontSize || "16px";
}

function getCurrentFontFamily(editor: ReturnType<typeof useEditor>): string {
  if (!editor) return "Predeterminada";
  const attrs = editor.getAttributes("textStyle");
  const ff = attrs.fontFamily || "";
  const found = FONT_FAMILIES.find((f) => f === ff);
  return found || "Predeterminada";
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

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 200, defaultHeight = 400 }: Props) {
  const [height, setHeight] = useState(defaultHeight);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = height;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [height]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientY - startY.current;
    const next = Math.max(minHeight, startH.current + delta);
    setHeight(next);
  }, [minHeight]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      FontSize,
      FontFamily,
      Color,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-3 py-2 focus:outline-none",
      },
    },
  });

  const fontSize = getCurrentFontSize(editor);
  const fontFamily = getCurrentFontFamily(editor);
  const currentColor = editor?.getAttributes("textStyle").color || "#000000";

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <div className="overflow-y-auto" style={{ height: `${height}px` }}>
        {editor && (
          <div className="flex items-center gap-0.5 border-b px-2 py-1.5 sticky top-0 bg-background z-10 shrink-0 flex-wrap">
            {/* Font family picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFontPicker(!showFontPicker)}
                className="rounded p-1.5 hover:bg-accent transition-colors text-xs flex items-center gap-1 min-w-[90px]"
                title="Tipo de letra"
              >
                {fontFamily || "Default"}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showFontPicker && (
                <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-20 py-1 min-w-[150px]">
                  {FONT_FAMILIES.map((ff) => (
                    <button
                      key={ff}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setFontFamily(ff).run();
                        setShowFontPicker(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors",
                        (ff === "" && fontFamily === "Predeterminada") || ff === fontFamily ? "bg-accent" : ""
                      )}
                      style={{ fontFamily: ff || "inherit" }}
                    >
                      {ff || "Predeterminada"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mx-1 h-4 w-px bg-border" />

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
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "rounded p-1.5 hover:bg-accent transition-colors",
                editor.isActive("italic") && "bg-accent text-foreground"
              )}
              title="Cursiva"
            >
              <Italic className="h-4 w-4" />
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
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={cn(
                "rounded p-1.5 hover:bg-accent transition-colors",
                editor.isActive("highlight") && "bg-accent text-foreground"
              )}
              title="Resaltar (fibrón)"
            >
              <Highlighter className="h-4 w-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-border" />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={cn(
                  "rounded p-1.5 hover:bg-accent transition-colors flex items-center gap-1",
                  editor.isActive("textStyle") && editor.getAttributes("textStyle").color && "bg-accent text-foreground"
                )}
                title="Color de texto"
              >
                <Palette className="h-4 w-4" />
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: currentColor }} />
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-20 p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {["#000000","#434343","#666666","#999999","#b7b7b7","#ffffff",
                      "#ff0000","#ff5722","#ff9800","#ffc107","#ffeb3b","#8bc34a",
                      "#4caf50","#009688","#00bcd4","#2196f3","#3f51b5","#9c27b0",
                      "#e91e63","#f44336","#795548","#607d8b","#000000","#ffffff",
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().setColor(c).run();
                          setShowColorPicker(false);
                        }}
                        className={cn(
                          "w-6 h-6 rounded border hover:scale-110 transition-transform",
                          currentColor === c ? "ring-2 ring-primary ring-offset-1" : ""
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setShowColorPicker(false);
                    }}
                    className="w-full mt-1 text-xs text-center py-1 rounded hover:bg-accent transition-colors"
                  >
                    Predeterminado
                  </button>
                </div>
              )}
            </div>

            <div className="mx-1 h-4 w-px bg-border" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "rounded p-1.5 hover:bg-accent transition-colors",
                editor.isActive("bulletList") && "bg-accent text-foreground"
              )}
              title="Viñetas"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "rounded p-1.5 hover:bg-accent transition-colors",
                editor.isActive("orderedList") && "bg-accent text-foreground"
              )}
              title="Numeración"
            >
              <ListOrdered className="h-4 w-4" />
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
            <div className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground min-w-[50px] justify-center">
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
      <div
        className="h-5 cursor-ns-resize flex items-center justify-center border-t bg-muted/50 hover:bg-muted transition-colors shrink-0 select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="w-8 h-1 rounded-full bg-border" />
      </div>
    </div>
  );
}
