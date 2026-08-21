import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback, useRef, useEffect } from "react";

function ImageResizeView({ node, updateAttributes, deleteNode }: { node: { attrs: Record<string, unknown> }; updateAttributes: (attrs: Record<string, unknown>) => void; deleteNode: () => void }) {
  const [width, setWidth] = useState<string>((node.attrs.width as string) || "100%");
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
      updateAttributes({ width });
    }
  }, [resizing, width, updateAttributes]);

  return (
    <NodeViewWrapper>
      <div
        ref={imgRef}
        className="relative group inline-block my-2"
        style={{ width }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) || ""}
          className="w-full h-auto rounded-lg block"
          draggable={false}
        />
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    };
  },

  parseHTML() {
    return [{ tag: "img" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView);
  },
});
