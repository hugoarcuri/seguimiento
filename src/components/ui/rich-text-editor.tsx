"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { ImageResize } from "@/lib/tiptap-image-resize";
import { TextStyle, FontSize, FontFamily, Color } from "@tiptap/extension-text-style";
import Suggestion from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import {
  Bold, Underline as UnderlineIcon, Italic, Highlighter,
  Minus, Plus, ChevronDown, Palette,
  ImagePlus, Link2, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus as MinusIcon, Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_SIZES = ["0.75rem", "0.875rem", "1rem", "1.125rem", "1.25rem", "1.5rem", "1.75rem", "2rem"];

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const slashCommandItems: SlashCommandItem[] = [
  {
    title: "Texto",
    description: "Bloque de texto normal",
    icon: <Type className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "Titulo 1",
    description: "Titulo grande",
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Titulo 2",
    description: "Titulo mediano",
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Titulo 3",
    description: "Titulo pequeno",
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Lista con viñetas",
    description: "Lista simple con puntos",
    icon: <List className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Lista numerada",
    description: "Lista con numeros",
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Cita",
    description: "Bloque de cita",
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Linea horizontal",
    description: "Separador horizontal",
    icon: <MinusIcon className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SlashCommandList({ items, command }: { items: SlashCommandItem[]; command: (item: SlashCommandItem) => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const clampedIndex = Math.min(selectedIndex, items.length - 1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => (i + items.length - 1) % items.length); return true; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => (i + 1) % items.length); return true; }
      if (e.key === "Enter") { e.preventDefault(); command(items[clampedIndex]); return true; }
      return false;
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [items, clampedIndex, command]);

  if (items.length === 0) {
    return <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm text-muted-foreground">Sin resultados</div>;
  }

  return (
    <div className="bg-popover border rounded-lg shadow-lg py-1 min-w-[220px] max-h-[280px] overflow-y-auto">
      {items.map((item, i) => (
        <button key={item.title} type="button"
          onMouseDown={(e) => { e.preventDefault(); command(item); }}
          onMouseEnter={() => setSelectedIndex(i)}
          className={cn(
            "w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors",
            i === clampedIndex ? "bg-accent text-foreground" : "text-foreground hover:bg-accent"
          )}>
          <div className="flex-shrink-0 w-8 h-8 rounded border bg-background flex items-center justify-center text-muted-foreground">
            {item.icon}
          </div>
          <div>
            <div className="font-medium">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        allowSpaces: true,
        items: ({ query }: { query: string }) => {
          return slashCommandItems.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          let component: ReactRenderer;
          let popup: TippyInstance[];

          return {
            onStart: (props: { editor: Editor; clientRect: () => DOMRect }) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });
              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },
            onUpdate: (props: { editor: Editor; clientRect: () => DOMRect }) => {
              component.updateProps(props);
              popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
              }
              return (component.ref as { onKeyDown: (props: { event: KeyboardEvent }) => boolean })?.onKeyDown?.(props) ?? false;
            },
            onExit: () => {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
        command: ({ editor, props }: { editor: Editor; props: SlashCommandItem }) => {
          props.command(editor);
        },
      } as Record<string, unknown>,
    };
  },
  addProseMirrorPlugins() {
    return [Suggestion(this.options.suggestion)];
  },
});

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node)) {
        setShowHeadingMenu(false);
      }
      if (showFontPicker) setShowFontPicker(false);
      if (showColorPicker) setShowColorPicker(false);
      if (showImageMenu) setShowImageMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFontPicker, showColorPicker, showImageMenu]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        code: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      ImageResize,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      SlashCommand,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "max-w-none px-3 py-2 focus:outline-none break-words min-h-[300px]",
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
          for (const part of styles.split(";")) {
            const [prop, val] = part.split(":").map((s: string) => s.trim());
            if (!prop || !val) continue;
            const p = prop.toLowerCase();
            if (["font-size", "font-weight", "font-style", "text-decoration", "color", "background-color", "font-family", "text-align", "text-decoration-line", "text-decoration-style"].includes(p)) {
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

  if (!editor) return <div className={cn("rounded-md border bg-background min-h-[200px]", className)} />;

  const fontSize = editor.getAttributes("textStyle").fontSize || "1rem";
  const currentColor = editor.getAttributes("textStyle").color || "#000000";

  const cmd = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    fn();
  };

  return (
    <div className={cn("rounded-md border bg-background flex flex-col min-h-0", className)}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5MB"); e.target.value = ""; return; }
          try { editor.chain().focus().insertContent({ type: "imageResize", attrs: { src: await fileToBase64(file), alt: "", title: "" } }).run(); }
          catch { toast.error("Error al procesar la imagen"); }
          e.target.value = "";
          setShowImageMenu(false);
        }} />

      <div className="flex items-center gap-0.5 border-b px-2 py-1.5 flex-wrap bg-background shrink-0">
        <div className="relative" ref={headingMenuRef}>
          <button type="button"
            className="rounded p-1.5 hover:bg-accent transition-colors text-xs flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); setShowHeadingMenu(!showHeadingMenu); }}>
            <Heading1 className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </button>
          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
              {[
                { label: "Normal", level: null, cls: "text-sm" },
                { label: "Titulo 1", level: 1 as const, cls: "text-xl font-bold" },
                { label: "Titulo 2", level: 2 as const, cls: "text-lg font-semibold" },
                { label: "Titulo 3", level: 3 as const, cls: "text-base font-medium" },
              ].map((opt) => (
                <button key={opt.label} type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (opt.level) editor.chain().focus().toggleHeading({ level: opt.level }).run();
                    else editor.chain().focus().setParagraph().run();
                    setShowHeadingMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                    opt.cls,
                    opt.level ? editor.isActive("heading", { level: opt.level }) && "bg-accent"
                      : !editor.isActive("heading") && "bg-accent"
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <button type="button" onMouseDown={(e) => cmd(e, () => editor.chain().focus().toggleBold().run())}
          className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("bold") && "bg-accent text-foreground")} title="Negrita (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => cmd(e, () => editor.chain().focus().toggleItalic().run())}
          className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("italic") && "bg-accent text-foreground")} title="Cursiva (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => cmd(e, () => editor.chain().focus().toggleUnderline().run())}
          className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("underline") && "bg-accent text-foreground")} title="Subrayado (Ctrl+U)">
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => cmd(e, () => editor.chain().focus().toggleHighlight().run())}
          className={cn("rounded p-1.5 hover:bg-accent transition-colors", editor.isActive("highlight") && "bg-accent text-foreground")} title="Resaltar">
          <Highlighter className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-px bg-border" />

        <div className="relative">
          <button type="button" title="Color de texto"
            onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
            className={cn("rounded p-1.5 hover:bg-accent transition-colors flex items-center gap-1", editor.isActive("textStyle") && editor.getAttributes("textStyle").color && "bg-accent text-foreground")}>
            <Palette className="h-4 w-4" />
            <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: currentColor }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 p-2">
              <div className="grid grid-cols-6 gap-1">
                {["#000000","#434343","#666666","#999999","#b7b7b7","#ffffff",
                  "#ff0000","#ff5722","#ff9800","#ffc107","#ffeb3b","#8bc34a",
                  "#4caf50","#009688","#00bcd4","#2196f3","#3f51b5","#9c27b0",
                  "#e91e63","#f44336","#795548","#607d8b","#000000","#ffffff",
                ].map((c) => (
                  <button key={c} type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                    className={cn("w-6 h-6 rounded border hover:scale-110 transition-transform", currentColor === c ? "ring-2 ring-primary ring-offset-1" : "")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <button type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                className="w-full mt-1 text-xs text-center py-1 rounded hover:bg-accent transition-colors">
                Predeterminado
              </button>
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <div className="relative">
          <button type="button" title="Insertar imagen"
            onClick={(e) => { e.stopPropagation(); setShowImageMenu(!showImageMenu); }}
            className="rounded p-1.5 hover:bg-accent transition-colors">
            <ImagePlus className="h-4 w-4" />
          </button>
          {showImageMenu && (
            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-2">
                <ImagePlus className="h-3.5 w-3.5" /> Subir archivo
              </button>
              <button type="button"
                onMouseDown={(e) => { e.preventDefault(); setShowUrlInput(!showUrlInput); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5" /> Desde URL
              </button>
            </div>
          )}
          {showUrlInput && (
            <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 p-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (imageUrl.trim()) { editor.chain().focus().insertContent({ type: "imageResize", attrs: { src: imageUrl.trim(), alt: "", title: "" } }).run(); setImageUrl(""); setShowUrlInput(false); setShowImageMenu(false); } } }}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="flex-1 h-8 text-sm border rounded px-2 bg-background" autoFocus />
              <button type="button"
                onMouseDown={(e) => { e.preventDefault(); if (imageUrl.trim()) { editor.chain().focus().insertContent({ type: "imageResize", attrs: { src: imageUrl.trim(), alt: "", title: "" } }).run(); setImageUrl(""); setShowUrlInput(false); setShowImageMenu(false); } }}
                className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm font-medium">OK</button>
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <button type="button" title="Achicar texto"
          onMouseDown={(e) => cmd(e, () => { const cur = editor.getAttributes("textStyle").fontSize || "1rem"; const idx = FONT_SIZES.indexOf(cur); if (idx > 0) editor.chain().focus().setFontSize(FONT_SIZES[idx - 1]).run(); })}>
          <Minus className="h-4 w-4" />
        </button>
        <input type="text" defaultValue={fontSize.replace("rem", "")} key={fontSize}
          className="w-10 h-7 text-center text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          title="Tamano de fuente en rem (Enter para aplicar)"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const num = parseFloat((e.target as HTMLInputElement).value.trim()); if (!isNaN(num) && num >= 0.5 && num <= 4) editor.chain().focus().setFontSize(`${num}rem`).run(); } }} />
        <button type="button" title="Agrandar texto"
          onMouseDown={(e) => cmd(e, () => { const cur = editor.getAttributes("textStyle").fontSize || "1rem"; const idx = FONT_SIZES.indexOf(cur); if (idx < FONT_SIZES.length - 1) editor.chain().focus().setFontSize(FONT_SIZES[idx + 1]).run(); })}>
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
