"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { ImageResize } from "@/lib/tiptap-image-resize";
import { TextStyle, FontSize, FontFamily, Color } from "@tiptap/extension-text-style";
import {
  Bold, Underline as UnderlineIcon, Italic, Highlighter,
  Minus, Plus, Type, List, ListOrdered, ChevronDown, Palette,
  ImagePlus, Link2, Maximize2, Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  defaultHeight?: number;
  defaultWidth?: number;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const FONT_FAMILIES = [
  "", "Arial", "Georgia", "Times New Roman", "Courier New", "Verdana",
  "Trebuchet MS", "Impact", "Comic Sans MS", "Palatino", "Garamond",
  "Bookman", "Lucida Console", "Tahoma", "Century Gothic", "Calibri",
];

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 200, defaultHeight = 400, defaultWidth }: Props) {
  const [height, setHeight] = useState(defaultHeight);
  const [width, setWidth] = useState<string | null>(defaultWidth ? `${defaultWidth}px` : null);
  const [maximized, setMaximized] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const dragging = useRef(false);
  const dragDir = useRef<"v" | "h" | "corner">("v");
  const startY = useRef(0);
  const startX = useRef(0);
  const startH = useRef(0);
  const startW = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const onPointerDown = useCallback((e: React.PointerEvent, dir: "v" | "h" | "corner") => {
    e.preventDefault();
    dragging.current = true;
    dragDir.current = dir;
    startY.current = e.clientY;
    startX.current = e.clientX;
    startH.current = containerRef.current?.offsetHeight || height;
    startW.current = containerRef.current?.offsetWidth || 300;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [height]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || maximized) return;
    const dir = dragDir.current;
    if (dir === "v" || dir === "corner") {
      const delta = e.clientY - startY.current;
      setHeight(Math.max(minHeight, startH.current + delta));
    }
    if (dir === "h" || dir === "corner") {
      const delta = e.clientX - startX.current;
      const newW = Math.max(200, startW.current + delta);
      setWidth(`${newW}px`);
    }
  }, [minHeight, maximized]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const toggleMaximize = useCallback(() => {
    setMaximized((m) => !m);
  }, []);

  useEffect(() => {
    if (maximized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [maximized]);

  const insertImage = useCallback((src: string) => {
    if (!editorRef.current) return;
    editorRef.current.chain().focus().insertContent({ type: "imageResize", attrs: { src, alt: "", title: "" } }).run();
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      e.target.value = "";
      return;
    }
    try {
      const src = await fileToBase64(file);
      insertImage(src);
    } catch {
      toast.error("Error al procesar la imagen");
    }
    e.target.value = "";
    setShowImageMenu(false);
  }, [insertImage]);

  const handleUrlInsert = useCallback(() => {
    if (imageUrl.trim()) {
      insertImage(imageUrl.trim());
      setImageUrl("");
      setShowUrlInput(false);
      setShowImageMenu(false);
    }
  }, [imageUrl, insertImage]);

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
      ImageResize,
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
        class: "prose prose-sm max-w-none px-3 py-2 focus:outline-none break-words overflow-wrap-anywhere",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              fileToBase64(file).then((src) => {
                editorRef.current?.chain().focus().insertContent({ type: "imageResize", attrs: { src, alt: "", title: "" } }).run();
              }).catch(() => {
                toast.error("Error al pegar la imagen");
              });
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const fontSize = getCurrentFontSize(editor);
  const fontFamily = getCurrentFontFamily(editor);
  const currentColor = editor?.getAttributes("textStyle").color || "#000000";

  const editorWrapper = (
    <div
      ref={containerRef}
      className={cn(
        "rounded-md border bg-background overflow-hidden flex flex-col",
        maximized && "fixed inset-0 z-50 rounded-none border-0",
        className
      )}
      style={maximized ? {} : width ? { width } : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <div className={cn("overflow-y-auto overflow-x-hidden flex-1", maximized && "min-h-0")}>
        {editor && (
          <div className="flex items-center gap-0.5 border-b px-2 py-1.5 shrink-0 flex-wrap bg-background">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowFontPicker(!showFontPicker); setShowColorPicker(false); setShowImageMenu(false); }}
                className="rounded p-1.5 hover:bg-accent transition-colors text-xs flex items-center gap-1 w-[90px] truncate"
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
                      onClick={() => { editor.chain().focus().setFontFamily(ff).run(); setShowFontPicker(false); }}
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

            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("bold") && "bg-accent text-foreground")} title="Negrita">
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("italic") && "bg-accent text-foreground")} title="Cursiva">
              <Italic className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("underline") && "bg-accent text-foreground")} title="Subrayado">
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("highlight") && "bg-accent text-foreground")} title="Resaltar">
              <Highlighter className="h-4 w-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-border" />

            <div className="relative">
              <button type="button" onClick={() => { setShowColorPicker(!showColorPicker); setShowFontPicker(false); setShowImageMenu(false); }}
                className={cn("rounded p-1.5 hover:bg-accent transition-colors flex items-center gap-1", editor.isActive("textStyle") && editor.getAttributes("textStyle").color && "bg-accent text-foreground")} title="Color de texto">
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
                      <button key={c} type="button" onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                        className={cn("w-6 h-6 rounded border hover:scale-110 transition-transform", currentColor === c ? "ring-2 ring-primary ring-offset-1" : "")}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                    className="w-full mt-1 text-xs text-center py-1 rounded hover:bg-accent transition-colors">
                    Predeterminado
                  </button>
                </div>
              )}
            </div>

            <div className="mx-1 h-4 w-px bg-border" />

            <div className="relative">
              <button type="button" onClick={() => { setShowImageMenu(!showImageMenu); setShowFontPicker(false); setShowColorPicker(false); }}
                className="rounded p-1.5 hover:bg-accent transition-colors" title="Insertar imagen">
                <ImagePlus className="h-4 w-4" />
              </button>
              {showImageMenu && (
                <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                  <button type="button" onClick={() => { fileInputRef.current?.click(); }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-2">
                    <ImagePlus className="h-3.5 w-3.5" /> Subir archivo
                  </button>
                  <button type="button" onClick={() => { setShowUrlInput(!showUrlInput); }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5" /> Desde URL
                  </button>
                </div>
              )}
              {showUrlInput && (
                <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-20 p-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUrlInsert(); } }}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="flex-1 h-8 text-sm border rounded px-2 bg-background" autoFocus />
                  <button type="button" onClick={handleUrlInsert} className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm font-medium">OK</button>
                </div>
              )}
            </div>

            <div className="mx-1 h-4 w-px bg-border" />

            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("bulletList") && "bg-accent text-foreground")} title="Viñetas">
              <List className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("orderedList") && "bg-accent text-foreground")} title="Numeración">
              <ListOrdered className="h-4 w-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-border" />

            <button type="button" onClick={() => cycleFontSize(editor, "down")}
              className="rounded p-1.5 hover:bg-accent transition-colors" title="Achicar texto">
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground min-w-[50px] justify-center">
              <Type className="h-3 w-3" />
              {fontSize.replace("px", "")}
            </div>
            <button type="button" onClick={() => cycleFontSize(editor, "up")}
              className="rounded p-1.5 hover:bg-accent transition-colors" title="Agrandar texto">
              <Plus className="h-4 w-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-border" />

            <button type="button" onClick={toggleMaximize}
              className="rounded p-1.5 hover:bg-accent transition-colors" title={maximized ? "Restaurar" : "Maximizar"}>
              {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        )}
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>

      {!maximized && (
        <>
          <div
            className="h-1.5 cursor-ns-resize bg-transparent hover:bg-primary/20 transition-colors shrink-0 select-none"
            onPointerDown={(e) => onPointerDown(e, "v")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <div
            className="w-1.5 absolute right-0 top-0 bottom-0 cursor-ew-resize bg-transparent hover:bg-primary/20 transition-colors select-none"
            onPointerDown={(e) => onPointerDown(e, "h")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <div
            className="w-4 h-4 absolute bottom-0 right-0 cursor-nwse-resize bg-transparent hover:bg-primary/20 transition-colors select-none"
            onPointerDown={(e) => onPointerDown(e, "corner")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </>
      )}
    </div>
  );

  if (maximized) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={toggleMaximize} />
        {editorWrapper}
      </>
    );
  }

  return editorWrapper;
}
