import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback, useRef, useEffect } from "react";

type Alignment = "center" | "left" | "right";

function ImageResizeView({ node, updateAttributes, deleteNode }: {
  node: { attrs: Record<string, unknown> };
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}) {
  const [width, setWidth] = useState<string>((node.attrs.width as string) || "100%");
  const [align, setAlign] = useState<Alignment>((node.attrs.align as Alignment) || "center");
  const [resizing, setResizing] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const imgRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    startX.current = e.clientX;
    startW.current = imgRef.current?.offsetWidth || 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing || !imgRef.current) return;
    const parent = imgRef.current.parentElement;
    const parentWidth = parent?.offsetWidth || 600;
    const delta = e.clientX - startX.current;
    const newW = Math.max(50, Math.min(parentWidth, startW.current + delta));
    const pct = `${Math.round((newW / parentWidth) * 100)}%`;
    setWidth(pct);
  }, [resizing]);

  const onPointerUp = useCallback(() => {
    setResizing(false);
  }, []);

  useEffect(() => {
    if (!resizing) {
      updateAttributes({ width, align });
    }
  }, [resizing, width, align, updateAttributes]);

  const handleAlign = (a: Alignment) => {
    setAlign(a);
  };

  const isFloat = align === "left" || align === "right";

  return (
    <NodeViewWrapper>
      <div
        ref={imgRef}
        className="relative group my-2"
        style={{
          width: isFloat ? width : width,
          float: isFloat ? align : undefined,
          marginLeft: align === "center" ? "auto" : undefined,
          marginRight: align === "center" ? "auto" : undefined,
          maxWidth: "100%",
        }}
      >
        <div className="absolute top-1 left-1 right-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex gap-0.5 bg-background/90 border rounded-md px-1 py-0.5 shadow-sm">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleAlign("left"); }}
              className={`p-1 rounded hover:bg-accent transition-colors ${align === "left" ? "bg-accent" : ""}`}
              title="Alinear izquierda (texto a la derecha)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="6" height="4" rx="1" />
                <rect x="1" y="8" width="14" height="1.5" rx="0.5" />
                <rect x="1" y="11" width="14" height="1.5" rx="0.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleAlign("center"); }}
              className={`p-1 rounded hover:bg-accent transition-colors ${align === "center" ? "bg-accent" : ""}`}
              title="Centrado (sin texto alrededor)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <rect x="5" y="2" width="6" height="4" rx="1" />
                <rect x="1" y="8" width="14" height="1.5" rx="0.5" />
                <rect x="1" y="11" width="14" height="1.5" rx="0.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleAlign("right"); }}
              className={`p-1 rounded hover:bg-accent transition-colors ${align === "right" ? "bg-accent" : ""}`}
              title="Alinear derecha (texto a la izquierda)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <rect x="9" y="2" width="6" height="4" rx="1" />
                <rect x="1" y="8" width="14" height="1.5" rx="0.5" />
                <rect x="1" y="11" width="14" height="1.5" rx="0.5" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
            className="w-6 h-6 rounded bg-destructive/80 hover:bg-destructive flex items-center justify-center"
          >
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 2L10 10M10 2L2 10" />
            </svg>
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) || ""}
          className="w-full h-auto rounded-lg block"
          draggable={false}
        />
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-primary/70 rounded-tl-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 11L11 1M11 1H5M11 1V7" />
          </svg>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const ImageResize = Node.create({
  name: "imageResize",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: "100%" },
      align: { default: "center" },
    };
  },

  parseHTML() {
    return [{ tag: "img" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { align, ...rest } = HTMLAttributes;
    if (align === "left" || align === "right") {
      return ["img", mergeAttributes(rest, { style: `float:${align};max-width:${rest.width || "100%"}` })];
    }
    return ["img", mergeAttributes(rest, { style: `display:block;margin-left:auto;margin-right:auto;max-width:${rest.width || "100%"}` })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView);
  },
});
