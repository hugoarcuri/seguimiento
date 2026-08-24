"use client";

import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { ImageResize } from "@/lib/tiptap-image-resize";
import { TextStyle, FontSize, FontFamily, Color } from "@tiptap/extension-text-style";
import {
  Bold, Underline as UnderlineIcon, Italic, Highlighter,
  Minus, Plus, List, ListOrdered, ChevronDown, Palette,
  ImagePlus, Link2, Heading,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const FONT_FAMILIES = [
  "", "Arial", "Georgia", "Times New Roman", "Courier New", "Verdana",
  "Trebuchet MS", "Impact", "Comic Sans MS", "Palatino", "Garamond",
  "Bookman", "Lucida Console", "Tahoma", "Century Gothic", "Calibri",
];

function getFontSize(editor: ReturnType<typeof useEditor>): string {
  if (!editor) return "16px";
  const attrs = editor.getAttributes("textStyle");
  return attrs.fontSize || "16px";
}

function getFontFamily(editor: ReturnType<typeof useEditor>): string {
  if (!editor) return "Predeterminada";
  const attrs = editor.getAttributes("textStyle");
  const ff = attrs.fontFamily || "";
  return FONT_FAMILIES.find((f) => f === ff) || "Predeterminada";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
        code: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
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
        class: "prose prose-sm max-w-none px-3 py-2 focus:outline-none break-words min-h-[300px]",
      },
      transformPastedHTML: (html: string) => {
        let cleaned = html;

        cleaned = cleaned.replace(/<head[\s\S]*?<\/head>/gi, "");
        cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");
        cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
        cleaned = cleaned.replace(/<meta[\s\S]*?>/gi, "");
        cleaned = cleaned.replace(/<title[\s\S]*?<\/title>/gi, "");
        cleaned = cleaned.replace(/<xml[\s\S]*?<\/xml>/gi, "");
        cleaned = cleaned.replace(/<o:p[\s\S]*?<\/o:p>/gi, "");
        cleaned = cleaned.replace(/<w:sdt[\s\S]*?<\/w:sdt>/gi, "");
        cleaned = cleaned.replace(/<v:shapetype[\s\S]*?<\/v:shapetype>/gi, "");
        cleaned = cleaned.replace(/<v:shape[\s\S]*?<\/v:shape>/gi, "");
        cleaned = cleaned.replace(/<v:imagedata[\s\S]*?\/?>/gi, "");

        cleaned = cleaned.replace(/style="([^"]*)"/gi, (_match, styles: string) => {
          const kept: string[] = [];
          const parts = styles.split(";");
          for (const part of parts) {
            const [prop, val] = part.split(":").map((s: string) => s.trim());
            if (!prop || !val) continue;
            const p = prop.toLowerCase();
            if (p === "font-size" || p === "font-weight" || p === "font-style" || p === "text-decoration" || p === "color" || p === "background-color" || p === "font-family" || p === "text-align" || p === "text-decoration-line" || p === "text-decoration-style") {
              let v = val;
              if (p === "font-size") {
                v = val.replace(/(\d+(?:\.\d+)?)pt/gi, (_m: string, pt: string) => `${Math.round(parseFloat(pt) * 1.333)}px`);
              }
              kept.push(`${prop}: ${v}`);
            }
          }
          return kept.length > 0 ? `style="${kept.join("; ")}"` : "";
        });

        cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, "");
        cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, "");
        cleaned = cleaned.replace(/<b:sampledata[\s\S]*?<\/b:sampledata>/gi, "");

        return cleaned;
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          for (const file of files) {
            if (file.type.startsWith("image/")) {
              event.preventDefault();
              fileToBase64(file).then((src) => {
                editor?.chain().focus().insertContent({ type: "imageResize", attrs: { src, alt: "", title: "" } }).run();
              }).catch(() => toast.error("Error al pegar la imagen"));
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  const run = useCallback((fn: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn(e);
  }, []);

  const fontSize = getFontSize(editor);
  const fontFamily = getFontFamily(editor);
  const currentColor = editor?.getAttributes("textStyle").color || "#000000";

  const insertImage = (src: string) => {
    editor?.chain().focus().insertContent({ type: "imageResize", attrs: { src, alt: "", title: "" } }).run();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleUrlInsert = () => {
    if (imageUrl.trim()) {
      insertImage(imageUrl.trim());
      setImageUrl("");
      setShowUrlInput(false);
      setShowImageMenu(false);
    }
  };

  const applyLevel = (level: 1 | 2 | 0) => run(() => {
    if (!editor) return;
    if (level === 1) {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (level === 2) {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
  });

  const toggleBulletList = run(() => {
    editor?.chain().focus().toggleBulletList().run();
  });

  const toggleOrderedList = run(() => {
    editor?.chain().focus().toggleOrderedList().run();
  });

  const cycleUp = run(() => {
    if (!editor) return;
    const current = getFontSize(editor);
    const idx = FONT_SIZES.indexOf(current);
    if (idx < FONT_SIZES.length - 1) {
      editor.chain().focus().setFontSize(FONT_SIZES[idx + 1]).run();
    }
  });

  const cycleDown = run(() => {
    if (!editor) return;
    const current = getFontSize(editor);
    const idx = FONT_SIZES.indexOf(current);
    if (idx > 0) {
      editor.chain().focus().setFontSize(FONT_SIZES[idx - 1]).run();
    }
  });

  const toggleBold = run(() => editor?.chain().focus().toggleBold().run());
  const toggleItalic = run(() => editor?.chain().focus().toggleItalic().run());
  const toggleUnderline = run(() => editor?.chain().focus().toggleUnderline().run());
  const toggleHighlight = run(() => editor?.chain().focus().toggleHighlight().run());

  const setColor = (c: string) => run(() => {
    editor?.chain().focus().setColor(c).run();
    setShowColorPicker(false);
  });

  const unsetColor = run(() => {
    editor?.chain().focus().unsetColor().run();
    setShowColorPicker(false);
  });

  const setFontFamily = (ff: string) => run(() => {
    editor?.chain().focus().setFontFamily(ff).run();
    setShowFontPicker(false);
  });

  const handleFontSizeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 6 && num <= 96) {
        editor?.chain().focus().setFontSize(`${num}px`).run();
      }
    }
  };

  return (
    <div className={cn("rounded-md border bg-background flex flex-col min-h-0", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      {editor && (
        <div className="flex items-center gap-0.5 border-b px-2 py-1.5 flex-wrap bg-background shrink-0">
          <div className="relative">
            <button
              type="button"
              onMouseDown={run(() => { setShowFontPicker(!showFontPicker); setShowColorPicker(false); setShowImageMenu(false); })}
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
                    onMouseDown={setFontFamily(ff)}
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

          <button type="button" onMouseDown={toggleBold}
            className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("bold") && "bg-accent text-foreground")} title="Negrita">
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" onMouseDown={toggleItalic}
            className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("italic") && "bg-accent text-foreground")} title="Cursiva">
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" onMouseDown={toggleUnderline}
            className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("underline") && "bg-accent text-foreground")} title="Subrayado">
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button type="button" onMouseDown={toggleHighlight}
            className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("highlight") && "bg-accent text-foreground")} title="Resaltar">
            <Highlighter className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          <div className="relative">
            <button type="button" onMouseDown={run(() => { setShowColorPicker(!showColorPicker); setShowFontPicker(false); setShowImageMenu(false); })}
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
                    <button key={c} type="button" onMouseDown={setColor(c)}
                      className={cn("w-6 h-6 rounded border hover:scale-110 transition-transform", currentColor === c ? "ring-2 ring-primary ring-offset-1" : "")}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button type="button" onMouseDown={unsetColor}
                  className="w-full mt-1 text-xs text-center py-1 rounded hover:bg-accent transition-colors">
                  Predeterminado
                </button>
              </div>
            )}
          </div>

          <div className="mx-1 h-4 w-px bg-border" />

          <div className="relative">
            <button type="button" onMouseDown={run(() => { setShowImageMenu(!showImageMenu); setShowFontPicker(false); setShowColorPicker(false); })}
              className="rounded p-1.5 hover:bg-accent transition-colors" title="Insertar imagen">
              <ImagePlus className="h-4 w-4" />
            </button>
            {showImageMenu && (
              <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-2">
                  <ImagePlus className="h-3.5 w-3.5" /> Subir archivo
                </button>
                <button type="button" onMouseDown={run(() => setShowUrlInput(!showUrlInput))}
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
                <button type="button" onMouseDown={(e) => { e.preventDefault(); handleUrlInsert(); }} className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm font-medium">OK</button>
              </div>
            )}
          </div>

          <div className="mx-1 h-4 w-px bg-border" />

          <button type="button" onMouseDown={toggleBulletList}
            className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("bulletList") && "bg-accent text-foreground")} title="Viñetas">
            <List className="h-4 w-4" />
          </button>
          <button type="button" onMouseDown={toggleOrderedList}
            className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("orderedList") && "bg-accent text-foreground")} title="Numeración">
            <ListOrdered className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          <div className="relative group">
            <button type="button" onMouseDown={run((e) => e.stopPropagation())}
              className="rounded p-1.5 hover:bg-accent transition-colors text-xs flex items-center gap-1" title="Niveles">
              <Heading className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-20 py-1 min-w-[140px] hidden group-hover:block">
              <button type="button" onMouseDown={applyLevel(1)}
                className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors font-bold text-base", editor.isActive("heading", { level: 1 }) && "bg-accent")}>
                Titulo 1
              </button>
              <button type="button" onMouseDown={applyLevel(2)}
                className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors font-semibold", editor.isActive("heading", { level: 2 }) && "bg-accent")}>
                Titulo 2
              </button>
              <button type="button" onMouseDown={applyLevel(0)}
                className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors", !editor.isActive("heading") && "bg-accent")}>
                Normal
              </button>
            </div>
          </div>

          <div className="mx-1 h-4 w-px bg-border" />

          <button type="button" onMouseDown={cycleDown}
            className="rounded p-1.5 hover:bg-accent transition-colors" title="Achicar texto">
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="text"
            defaultValue={fontSize.replace("px", "")}
            key={fontSize}
            className="w-10 h-7 text-center text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            title="Tamano de fuente (Enter para aplicar)"
            onKeyDown={handleFontSizeInput}
          />
          <button type="button" onMouseDown={cycleUp}
            className="rounded p-1.5 hover:bg-accent transition-colors" title="Agrandar texto">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="overflow-y-auto flex-1 min-h-0">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
