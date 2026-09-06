"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Canvas as FabricCanvas,
  FabricImage,
  Textbox,
  Rect,
  Circle,
  Line,
  FabricObject,
} from "fabric";
import { DocumentSizePreset, SelectedElementProperties, CertificateTemplate } from "@/types";
import {
  DOCUMENT_PRESETS,
  SAMPLE_RECIPIENTS,
  extractVariables,
} from "./editor-utils";
import { EditorTopbar } from "./editor-topbar";
import { EditorSidebarLeft } from "./editor-sidebar-left";
import { EditorSidebarRight } from "./editor-sidebar-right";
import { EditorPreviewModal } from "./editor-preview-modal";
import { downloadCertificatePdf } from "@/lib/certificate-engine";
import { Eye } from "lucide-react";

interface CustomMeta {
  isVariable?: boolean;
  variableName?: string;
  isCertificateBackground?: boolean;
  originalText?: string;
  lockAspectRatio?: boolean;
}

function getMeta(obj: unknown): CustomMeta {
  if (obj && typeof obj === "object") {
    return obj as CustomMeta;
  }
  return {};
}

function setMeta(obj: unknown, data: CustomMeta) {
  if (obj && typeof obj === "object") {
    Object.assign(obj, data);
  }
}

export function CertificateEditor() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  // Template state
  const [templateName, setTemplateName] = useState(() => {
    if (typeof window === "undefined" || !templateId) return "Certificate of Achievement";
    try {
      const stored = localStorage.getItem("certimail_templates");
      if (stored) {
        const list: CertificateTemplate[] = JSON.parse(stored);
        const found = list.find((t) => t.id === templateId);
        if (found) return found.name;
      }
    } catch {
      // fallback
    }
    return "Certificate of Achievement";
  });
  const [docPreset, setDocPreset] = useState<DocumentSizePreset>(DOCUMENT_PRESETS[0]);
  const [customWidth, setCustomWidth] = useState(3508);
  const [customHeight, setCustomHeight] = useState(2480);
  const [backgroundName, setBackgroundName] = useState<string | null>(() => {
    if (typeof window === "undefined" || !templateId) return null;
    try {
      const stored = localStorage.getItem("certimail_templates");
      if (stored) {
        const list: CertificateTemplate[] = JSON.parse(stored);
        const found = list.find((t) => t.id === templateId);
        if (found) return found.backgroundName || null;
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Zoom & Viewport (Initial zoom scaled for 3508px document)
  const [zoom, setZoom] = useState(0.25);

  // In-Canvas Preview Mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Selected element properties
  const [selected, setSelected] = useState<SelectedElementProperties | null>(null);

  // Undo / Redo history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isHistoryActionRef = useRef<boolean>(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Fullscreen Export Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecipientIdx, setPreviewRecipientIdx] = useState(0);
  const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string | null>(null);

  const docWidth = docPreset.id === "custom" ? customWidth : docPreset.width;
  const docHeight = docPreset.id === "custom" ? customHeight : docPreset.height;

  // -------------------------------------------------------------
  // HISTORY / UNDO-REDO MANAGEMENT
  // -------------------------------------------------------------
  const saveHistoryState = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || isHistoryActionRef.current) return;

    try {
      const json = JSON.stringify(
        canvas.toObject([
          "isVariable",
          "variableName",
          "isCertificateBackground",
          "id",
          "originalText",
          "lockAspectRatio",
        ])
      );

      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(json);

      // Keep maximum 60 states
      if (newHistory.length > 60) {
        newHistory.shift();
      }

      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;

      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
      setSaveStatus("unsaved");
    } catch (e) {
      console.error("Failed to save history state:", e);
    }
  }, []);

  const handleUndo = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;

    isHistoryActionRef.current = true;
    historyIndexRef.current -= 1;
    const targetState = historyRef.current[historyIndexRef.current];

    try {
      await canvas.loadFromJSON(JSON.parse(targetState));
      canvas.requestRenderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
      setSelected(null);
      setSaveStatus("unsaved");
    } catch (e) {
      console.error("Undo failed:", e);
    } finally {
      isHistoryActionRef.current = false;
    }
  }, []);

  const handleRedo = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    isHistoryActionRef.current = true;
    historyIndexRef.current += 1;
    const targetState = historyRef.current[historyIndexRef.current];

    try {
      await canvas.loadFromJSON(JSON.parse(targetState));
      canvas.requestRenderAll();
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      setSelected(null);
      setSaveStatus("unsaved");
    } catch (e) {
      console.error("Redo failed:", e);
    } finally {
      isHistoryActionRef.current = false;
    }
  }, []);

  // -------------------------------------------------------------
  // CANVAS INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return;

    const initialCanvas = new FabricCanvas(canvasRef.current, {
      width: docWidth * zoom,
      height: docHeight * zoom,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    initialCanvas.setZoom(zoom);
    fabricRef.current = initialCanvas;

    const syncSelection = () => {
      const active = initialCanvas.getActiveObject();
      if (!active) {
        setSelected(null);
        return;
      }

      if (getMeta(active).isCertificateBackground) {
        initialCanvas.discardActiveObject();
        initialCanvas.requestRenderAll();
        setSelected(null);
        return;
      }

      const isTextType = active.type === "text" || active.type === "textbox";
      const isRectType = active.type === "rect";
      const isCircleType = active.type === "circle";
      const isLineType = active.type === "line";
      const isImageType = active.type === "image";

      let typeName: SelectedElementProperties["type"] = "group";
      if (isTextType) typeName = "textbox";
      else if (isRectType) typeName = "rect";
      else if (isCircleType) typeName = "circle";
      else if (isLineType) typeName = "line";
      else if (isImageType) typeName = "image";

      const meta = getMeta(active);

      setSelected({
        type: typeName,
        text: isTextType ? (active as Textbox).text : undefined,
        fontFamily: isTextType ? (active as Textbox).fontFamily : undefined,
        fontSize: isTextType ? (active as Textbox).fontSize : undefined,
        fontWeight: isTextType ? (active as Textbox).fontWeight : undefined,
        fontStyle: isTextType ? ((active as Textbox).fontStyle as "normal" | "italic") : undefined,
        underline: isTextType ? (active as Textbox).underline : undefined,
        linethrough: isTextType ? (active as Textbox).linethrough : undefined,
        textAlign: isTextType
          ? ((active as Textbox).textAlign as "left" | "center" | "right" | "justify")
          : undefined,
        lineHeight: isTextType ? (active as Textbox).lineHeight : undefined,
        charSpacing: isTextType ? (active as Textbox).charSpacing : undefined,
        fill: String(active.fill || "#18181b"),
        stroke: active.stroke ? String(active.stroke) : "#000000",
        strokeWidth: active.strokeWidth || 0,
        opacity: active.opacity ?? 1,
        left: active.left,
        top: active.top,
        width: active.getScaledWidth(),
        height: active.getScaledHeight(),
        angle: active.angle,
        lockAspectRatio: meta.lockAspectRatio,
        isVariable: meta.isVariable,
        variableName: meta.variableName,
      });
    };

    initialCanvas.on("selection:created", syncSelection);
    initialCanvas.on("selection:updated", syncSelection);
    initialCanvas.on("selection:cleared", () => setSelected(null));

    initialCanvas.on("object:modified", () => {
      syncSelection();
      saveHistoryState();
    });

    initialCanvas.on("object:moving", syncSelection);
    initialCanvas.on("object:scaling", syncSelection);
    initialCanvas.on("object:rotating", syncSelection);

    initialCanvas.on("object:added", () => {
      saveHistoryState();
    });

    initialCanvas.on("object:removed", () => {
      saveHistoryState();
    });

    // Load Existing Template if ?id= is given
    let hasLoadedExisting = false;
    if (templateId) {
      try {
        const storedTemplates = localStorage.getItem("certimail_templates");
        if (storedTemplates) {
          const list: CertificateTemplate[] = JSON.parse(storedTemplates);
          const found = list.find((t) => t.id === templateId);
          if (found && found.canvasJSON) {
            initialCanvas.loadFromJSON(found.canvasJSON).then(() => {
              initialCanvas.requestRenderAll();
              saveHistoryState();
            });
            hasLoadedExisting = true;
          }
        }
      } catch (err) {
        console.error("Failed to load existing template:", err);
      }
    }

    // Default template layout for high-res standard canvas
    if (!hasLoadedExisting) {
      const scaleFactor = docWidth / 1123;

      const title = new Textbox("CERTIFICATE OF ACHIEVEMENT", {
        left: docWidth / 2,
        top: 360 * scaleFactor,
        originX: "center",
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: Math.round(32 * scaleFactor),
        fontWeight: "bold",
        fill: "#18181b",
        textAlign: "center",
        width: 900 * scaleFactor,
      });

      const subtitle = new Textbox("THIS IS PROUDLY PRESENTED TO", {
        left: docWidth / 2,
        top: 470 * scaleFactor,
        originX: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: Math.round(14 * scaleFactor),
        fontWeight: 600,
        fill: "#71717a",
        textAlign: "center",
        width: 800 * scaleFactor,
      });

      const nameVar = new Textbox("{{name}}", {
        left: docWidth / 2,
        top: 580 * scaleFactor,
        originX: "center",
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: Math.round(48 * scaleFactor),
        fontWeight: "bold",
        fill: "#09090b",
        textAlign: "center",
        width: 950 * scaleFactor,
      });
      setMeta(nameVar, {
        isVariable: true,
        variableName: "name",
        originalText: "{{name}}",
      });

      const reason = new Textbox(
        "for outstanding participation and successfully completing all milestones in",
        {
          left: docWidth / 2,
          top: 730 * scaleFactor,
          originX: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: Math.round(15 * scaleFactor),
          fill: "#52525b",
          textAlign: "center",
          width: 850 * scaleFactor,
        }
      );

      const eventVar = new Textbox("{{event}}", {
        left: docWidth / 2,
        top: 830 * scaleFactor,
        originX: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: Math.round(26 * scaleFactor),
        fontWeight: "bold",
        fill: "#09090b",
        textAlign: "center",
        width: 850 * scaleFactor,
      });
      setMeta(eventVar, {
        isVariable: true,
        variableName: "event",
        originalText: "{{event}}",
      });

      const dateVar = new Textbox("Issued on {{date}}", {
        left: docWidth / 2,
        top: 980 * scaleFactor,
        originX: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: Math.round(14 * scaleFactor),
        fill: "#71717a",
        textAlign: "center",
        width: 500 * scaleFactor,
      });
      setMeta(dateVar, {
        isVariable: true,
        variableName: "date",
        originalText: "Issued on {{date}}",
      });

      const certIdVar = new Textbox("Credential ID: {{certificate_id}}", {
        left: docWidth / 2,
        top: docHeight - 120 * scaleFactor,
        originX: "center",
        fontFamily: "Courier New, monospace",
        fontSize: Math.round(11 * scaleFactor),
        fill: "#a1a1aa",
        textAlign: "center",
        width: 600 * scaleFactor,
      });
      setMeta(certIdVar, {
        isVariable: true,
        variableName: "certificate_id",
        originalText: "Credential ID: {{certificate_id}}",
      });

      initialCanvas.add(title);
      initialCanvas.add(subtitle);
      initialCanvas.add(nameVar);
      initialCanvas.add(reason);
      initialCanvas.add(eventVar);
      initialCanvas.add(dateVar);
      initialCanvas.add(certIdVar);

      initialCanvas.requestRenderAll();
      saveHistoryState();
    }

    return () => {
      initialCanvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------
  // ZOOM & DIMENSION UPDATER
  // -------------------------------------------------------------
  const updateCanvasDimensions = useCallback(
    (newZoom: number, targetWidth: number, targetHeight: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      canvas.setDimensions({
        width: targetWidth * newZoom,
        height: targetHeight * newZoom,
      });
      canvas.setZoom(newZoom);
      canvas.requestRenderAll();
    },
    []
  );

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(0.1, Math.min(2.0, newZoom));
    setZoom(clamped);
    updateCanvasDimensions(clamped, docWidth, docHeight);
  };

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const availableWidth = containerRef.current.clientWidth - 80;
    const availableHeight = containerRef.current.clientHeight - 80;

    const fitRatio = Math.min(
      availableWidth / docWidth,
      availableHeight / docHeight,
      1.0
    );

    const safeZoom = Math.max(0.1, Math.min(1.5, Math.round(fitRatio * 100) / 100));
    setZoom(safeZoom);
    updateCanvasDimensions(safeZoom, docWidth, docHeight);
  }, [docWidth, docHeight, updateCanvasDimensions]);

  // Initial fit to screen on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 150);
    return () => clearTimeout(timer);
  }, [handleFitToScreen]);

  // Handle Preset Change
  const handleSelectPreset = (preset: DocumentSizePreset) => {
    setDocPreset(preset);
    const w = preset.width;
    const h = preset.height;
    updateCanvasDimensions(zoom, w, h);
    saveHistoryState();
  };

  const handleCustomDimensionsChange = (w: number, h: number) => {
    setCustomWidth(w);
    setCustomHeight(h);
    updateCanvasDimensions(zoom, w, h);
    saveHistoryState();
  };

  // -------------------------------------------------------------
  // BACKGROUND IMAGE MANAGEMENT
  // -------------------------------------------------------------
  const handleBackgroundUpload = async (file: File) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;

      try {
        const image = await FabricImage.fromURL(dataUrl);

        canvas.getObjects().forEach((obj) => {
          if (getMeta(obj).isCertificateBackground) {
            canvas.remove(obj);
          }
        });

        const imageWidth = image.width || 1;
        const imageHeight = image.height || 1;

        const scale = Math.max(docWidth / imageWidth, docHeight / imageHeight);

        image.set({
          left: docWidth / 2,
          top: docHeight / 2,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          excludeFromExport: false,
        });

        setMeta(image, { isCertificateBackground: true });

        canvas.add(image);
        canvas.sendObjectToBack(image);
        canvas.requestRenderAll();

        setBackgroundName(file.name);
        saveHistoryState();
      } catch (err) {
        console.error("Background upload failed:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if (getMeta(obj).isCertificateBackground) {
        canvas.remove(obj);
      }
    });

    canvas.requestRenderAll();
    setBackgroundName(null);
    saveHistoryState();
  };

  // -------------------------------------------------------------
  // ADD ELEMENTS
  // -------------------------------------------------------------
  const handleAddText = (type: "heading" | "subheading" | "body") => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const scaleFactor = docWidth / 1123;
    let fontSize = Math.round(20 * scaleFactor);
    let fontWeight: string | number = "normal";
    let defaultText = "Double click to edit";

    if (type === "heading") {
      fontSize = Math.round(36 * scaleFactor);
      fontWeight = "bold";
      defaultText = "CERTIFICATE TITLE";
    } else if (type === "subheading") {
      fontSize = Math.round(20 * scaleFactor);
      fontWeight = "600";
      defaultText = "Presented in Honor of Excellence";
    } else {
      fontSize = Math.round(15 * scaleFactor);
      defaultText = "Enter certificate description or body content here.";
    }

    const text = new Textbox(defaultText, {
      left: docWidth / 2,
      top: docHeight / 2,
      originX: "center",
      originY: "center",
      fontFamily: "Inter, sans-serif",
      fontSize,
      fontWeight,
      fill: "#18181b",
      textAlign: "center",
      width: Math.round(550 * scaleFactor),
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    saveHistoryState();
  };

  const handleAddVariable = (variableKey: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const scaleFactor = docWidth / 1123;
    const token = `{{${variableKey}}}`;
    const text = new Textbox(token, {
      left: docWidth / 2,
      top: docHeight / 2,
      originX: "center",
      originY: "center",
      fontFamily: "Inter, sans-serif",
      fontSize: Math.round(32 * scaleFactor),
      fontWeight: "bold",
      fill: "#09090b",
      textAlign: "center",
      width: Math.round(500 * scaleFactor),
    });

    setMeta(text, {
      isVariable: true,
      variableName: variableKey,
      originalText: token,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    saveHistoryState();
  };

  const handleAddShape = (shape: "rect" | "circle" | "line") => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const scaleFactor = docWidth / 1123;
    let obj: FabricObject;

    if (shape === "rect") {
      obj = new Rect({
        left: docWidth / 2,
        top: docHeight / 2,
        originX: "center",
        originY: "center",
        width: Math.round(240 * scaleFactor),
        height: Math.round(160 * scaleFactor),
        fill: "#f4f4f5",
        stroke: "#27272a",
        strokeWidth: Math.max(1, Math.round(2 * scaleFactor)),
      });
    } else if (shape === "circle") {
      obj = new Circle({
        left: docWidth / 2,
        top: docHeight / 2,
        originX: "center",
        originY: "center",
        radius: Math.round(80 * scaleFactor),
        fill: "#f4f4f5",
        stroke: "#27272a",
        strokeWidth: Math.max(1, Math.round(2 * scaleFactor)),
      });
    } else {
      obj = new Line([0, 0, Math.round(400 * scaleFactor), 0], {
        left: docWidth / 2 - Math.round(200 * scaleFactor),
        top: docHeight / 2,
        stroke: "#18181b",
        strokeWidth: Math.max(1, Math.round(2 * scaleFactor)),
      });
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    saveHistoryState();
  };

  const handleAddImage = (file: File) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;

      try {
        const image = await FabricImage.fromURL(dataUrl);
        const scaleFactor = docWidth / 1123;
        const maxDimension = 350 * scaleFactor;
        const scale = Math.min(
          maxDimension / (image.width || 300),
          maxDimension / (image.height || 300),
          1
        );

        image.set({
          left: docWidth / 2,
          top: docHeight / 2,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });

        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        saveHistoryState();
      } catch (e) {
        console.error("Failed to add image:", e);
      }
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // UPDATE PROPERTIES OF SELECTED
  // -------------------------------------------------------------
  const handleUpdateProperty = (
    property: keyof SelectedElementProperties,
    value: string | number | boolean | undefined
  ) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || getMeta(active).isCertificateBackground) return;

    if (property === "text") {
      if ("text" in active) {
        (active as Textbox).set("text", String(value || ""));
        if (getMeta(active).isVariable) {
          setMeta(active, { originalText: String(value || "") });
        }
      }
    } else if (property === "width") {
      const numVal = Math.max(1, Number(value));
      if (active.type === "textbox" || active.type === "rect") {
        active.set("width", numVal);
        active.set("scaleX", 1);
      } else {
        active.set("scaleX", numVal / (active.width || 1));
      }
    } else if (property === "height") {
      const numVal = Math.max(1, Number(value));
      if (active.type === "rect") {
        active.set("height", numVal);
        active.set("scaleY", 1);
      } else if (active.type !== "textbox") {
        active.set("scaleY", numVal / (active.height || 1));
      }
    } else if (property === "lockAspectRatio") {
      setMeta(active, { lockAspectRatio: Boolean(value) });
    } else {
      active.set(property as never, value);
    }

    active.setCoords();
    canvas.requestRenderAll();

    setSelected((prev) => (prev ? { ...prev, [property]: value } : null));
    saveHistoryState();
  };

  // -------------------------------------------------------------
  // DUPLICATE & DELETE
  // -------------------------------------------------------------
  const handleDuplicate = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || getMeta(active).isCertificateBackground) return;

    try {
      const cloned = await active.clone();
      cloned.set({
        left: (active.left || 0) + 30,
        top: (active.top || 0) + 30,
      });

      const meta = getMeta(active);
      if (meta.isVariable) {
        setMeta(cloned, {
          isVariable: true,
          variableName: meta.variableName,
          originalText: meta.originalText,
        });
      }

      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      saveHistoryState();
    } catch (e) {
      console.error("Duplicate failed:", e);
    }
  }, [saveHistoryState]);

  const handleDelete = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || getMeta(active).isCertificateBackground) return;

    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setSelected(null);
    saveHistoryState();
  }, [saveHistoryState]);

  // -------------------------------------------------------------
  // ALIGNMENT TOOLS
  // -------------------------------------------------------------
  const handleAlignCanvas = (
    alignment: "left" | "center-h" | "right" | "top" | "center-v" | "bottom"
  ) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || getMeta(active).isCertificateBackground) return;

    const scaledW = active.getScaledWidth();
    const scaledH = active.getScaledHeight();

    if (alignment === "center-h") {
      if (active.originX === "center") {
        active.set({ left: docWidth / 2 });
      } else {
        active.set({ left: (docWidth - scaledW) / 2 });
      }
    } else if (alignment === "center-v") {
      if (active.originY === "center") {
        active.set({ top: docHeight / 2 });
      } else {
        active.set({ top: (docHeight - scaledH) / 2 });
      }
    } else if (alignment === "left") {
      active.set({
        left: active.originX === "center" ? scaledW / 2 : 0,
      });
    } else if (alignment === "right") {
      active.set({
        left: active.originX === "center" ? docWidth - scaledW / 2 : docWidth - scaledW,
      });
    } else if (alignment === "top") {
      active.set({
        top: active.originY === "center" ? scaledH / 2 : 0,
      });
    } else if (alignment === "bottom") {
      active.set({
        top: active.originY === "center" ? docHeight - scaledH / 2 : docHeight - scaledH,
      });
    }

    active.setCoords();
    canvas.requestRenderAll();

    setSelected((prev) =>
      prev
        ? {
            ...prev,
            left: active.left,
            top: active.top,
          }
        : null
    );
    saveHistoryState();
  };

  // -------------------------------------------------------------
  // LAYER ORDERING
  // -------------------------------------------------------------
  const handleLayerChange = (
    action: "bring-front" | "bring-forward" | "send-backward" | "send-back"
  ) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || getMeta(active).isCertificateBackground) return;

    if (action === "bring-front") {
      canvas.bringObjectToFront(active);
    } else if (action === "bring-forward") {
      canvas.bringObjectForward(active);
    } else if (action === "send-backward") {
      canvas.sendObjectBackwards(active);
    } else if (action === "send-back") {
      canvas.sendObjectToBack(active);
    }

    // Always ensure background is behind all objects
    const bgObj = canvas
      .getObjects()
      .find((o) => getMeta(o).isCertificateBackground);
    if (bgObj) {
      canvas.sendObjectToBack(bgObj);
    }

    canvas.requestRenderAll();
    saveHistoryState();
  };

  // -------------------------------------------------------------
  // IN-CANVAS PREVIEW TOGGLE
  // -------------------------------------------------------------
  const handleTogglePreviewMode = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const next = !isPreviewMode;
    setIsPreviewMode(next);

    if (next) {
      canvas.discardActiveObject();
      canvas.selection = false;
      canvas.getObjects().forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      setSelected(null);
    } else {
      canvas.selection = true;
      canvas.getObjects().forEach((obj) => {
        if (!getMeta(obj).isCertificateBackground) {
          obj.selectable = true;
          obj.evented = true;
        }
      });
    }

    canvas.requestRenderAll();
  };

  // -------------------------------------------------------------
  // FULL RESOLUTION EXPORT PREVIEW MODAL
  // -------------------------------------------------------------
  const generatePreviewImage = useCallback(
    (recipientIdx: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const recipient = SAMPLE_RECIPIENTS[recipientIdx];

      const savedTexts: { obj: Textbox; text: string }[] = [];
      canvas.getObjects().forEach((obj) => {
        const meta = getMeta(obj);
        if (meta.isVariable && (obj.type === "textbox" || obj.type === "text")) {
          const textObj = obj as Textbox;
          const original = meta.originalText || textObj.text || "";
          savedTexts.push({ obj: textObj, text: textObj.text || "" });

          let replaced = original;
          Object.keys(recipient).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, "gi");
            replaced = replaced.replace(regex, recipient[key]);
          });
          textObj.set("text", replaced);
        }
      });

      canvas.requestRenderAll();

      // Export 1:1 scale (independent of zoom)
      const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: 1 / zoom,
      });

      // Restore original tokens
      savedTexts.forEach(({ obj, text }) => {
        obj.set("text", text);
      });
      canvas.requestRenderAll();

      setRenderedPreviewUrl(dataUrl);
    },
    [zoom]
  );

  const handleOpenPreview = () => {
    setPreviewOpen(true);
    generatePreviewImage(previewRecipientIdx);
  };

  const handleSelectRecipientIndex = (idx: number) => {
    setPreviewRecipientIdx(idx);
    generatePreviewImage(idx);
  };

  const handleDownloadPNG = () => {
    if (!renderedPreviewUrl) return;
    const recipient = SAMPLE_RECIPIENTS[previewRecipientIdx];
    const safeName = recipient.name.replace(/[^a-zA-Z0-9]/g, "_");
    const link = document.createElement("a");
    link.download = `${safeName}_Certificate.png`;
    link.href = renderedPreviewUrl;
    link.click();
  };

  const handleDownloadPDF = () => {
    if (!renderedPreviewUrl) return;
    const recipient = SAMPLE_RECIPIENTS[previewRecipientIdx];
    const safeName = recipient.name.replace(/[^a-zA-Z0-9]/g, "_");
    downloadCertificatePdf(
      renderedPreviewUrl,
      `${safeName}_Certificate.pdf`,
      docWidth,
      docHeight,
      docPreset.orientation || "landscape"
    );
  };

  // -------------------------------------------------------------
  // SAVE TEMPLATE
  // -------------------------------------------------------------
  const handleSave = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    setSaveStatus("saving");

    try {
      const canvasJSON = canvas.toObject([
        "isVariable",
        "variableName",
        "isCertificateBackground",
        "id",
        "originalText",
        "lockAspectRatio",
      ]);

      const vars: string[] = [];
      canvas.getObjects().forEach((obj) => {
        const meta = getMeta(obj);
        if (meta.isVariable && meta.variableName) {
          vars.push(meta.variableName);
        } else if (obj.type === "textbox" || obj.type === "text") {
          const found = extractVariables((obj as Textbox).text || "");
          vars.push(...found);
        }
      });

      const uniqueVars = Array.from(new Set(vars));

      const thumb = canvas.toDataURL({
        format: "png",
        multiplier: (320 / docWidth) / zoom,
      });

      const template: CertificateTemplate = {
        id: templateId || `tpl-${Date.now()}`,
        name: templateName,
        width: docWidth,
        height: docHeight,
        orientation: docPreset.orientation || "landscape",
        backgroundName,
        canvasJSON,
        thumbnailUrl: thumb,
        variables: uniqueVars,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };

      const stored = localStorage.getItem("certimail_templates");
      const list: CertificateTemplate[] = stored ? JSON.parse(stored) : [];
      const existingIdx = list.findIndex((t) => t.id === template.id);

      if (existingIdx >= 0) {
        list[existingIdx] = template;
      } else {
        list.unshift(template);
      }

      localStorage.setItem("certimail_templates", JSON.stringify(list));
      setSaveStatus("saved");
    } catch (e) {
      console.error("Failed to save template:", e);
      setSaveStatus("unsaved");
    }
  }, [docWidth, docHeight, docPreset, backgroundName, templateId, templateName, zoom]);

  // Debounced Autosave
  useEffect(() => {
    if (saveStatus !== "unsaved") return;
    const timer = setTimeout(() => {
      handleSave();
    }, 800);
    return () => clearTimeout(timer);
  }, [saveStatus, handleSave]);

  // -------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();

      // Don't intercept if user is actively typing inside Fabric Textbox
      if (active && "isEditing" in active && (active as Textbox).isEditing) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (canvas && active && !getMeta(active).isCertificateBackground) {
          e.preventDefault();
          handleDelete();
          return;
        }
      }

      // Deselect (Escape)
      if (e.key === "Escape") {
        if (canvas) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          setSelected(null);
        }
        return;
      }

      // Arrow Keys Nudging
      if (
        active &&
        !getMeta(active).isCertificateBackground &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const currentLeft = active.left || 0;
        const currentTop = active.top || 0;

        if (e.key === "ArrowUp") active.set("top", currentTop - step);
        if (e.key === "ArrowDown") active.set("top", currentTop + step);
        if (e.key === "ArrowLeft") active.set("left", currentLeft - step);
        if (e.key === "ArrowRight") active.set("left", currentLeft + step);

        active.setCoords();
        canvas?.requestRenderAll();

        setSelected((prev) =>
          prev
            ? {
                ...prev,
                left: active.left,
                top: active.top,
              }
            : null
        );
        saveHistoryState();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, handleDuplicate, handleDelete, saveHistoryState]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* TOPBAR */}
      <EditorTopbar
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onFitToScreen={handleFitToScreen}
        isPreviewMode={isPreviewMode}
        onTogglePreviewMode={handleTogglePreviewMode}
        onOpenPreview={handleOpenPreview}
        saveStatus={saveStatus}
        onSave={handleSave}
      />

      {/* THREE PANEL WORKSPACE */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT PANEL (hidden in in-canvas preview mode) */}
        {!isPreviewMode && (
          <EditorSidebarLeft
            currentPreset={docPreset}
            onSelectPreset={handleSelectPreset}
            customWidth={customWidth}
            customHeight={customHeight}
            onCustomDimensionsChange={handleCustomDimensionsChange}
            backgroundName={backgroundName}
            onBackgroundUpload={handleBackgroundUpload}
            onRemoveBackground={handleRemoveBackground}
            onAddText={handleAddText}
            onAddShape={handleAddShape}
            onAddImage={handleAddImage}
            onAddVariable={handleAddVariable}
          />
        )}

        {/* CENTER CANVAS VIEWPORT */}
        <main
          ref={containerRef}
          className="relative flex flex-1 items-center justify-center overflow-auto bg-zinc-950/70 p-8 lg:p-12"
        >
          {/* Floating Exit Preview Pill */}
          {isPreviewMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-xs font-medium text-foreground shadow-2xl backdrop-blur-md">
              <Eye size={14} className="text-emerald-400" />
              <span>Preview Mode — Clean Certificate Display</span>
              <button
                type="button"
                onClick={handleTogglePreviewMode}
                className="ml-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                Exit Preview
              </button>
            </div>
          )}

          {/* Certificate Canvas Sheet */}
          <div
            className={`relative rounded-lg border bg-white shadow-2xl transition-all ${
              isPreviewMode ? "border-transparent" : "border-zinc-700/80"
            }`}
            style={{
              width: docWidth * zoom,
              height: docHeight * zoom,
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </main>

        {/* RIGHT PROPERTIES PANEL (hidden in in-canvas preview mode) */}
        {!isPreviewMode && (
          <EditorSidebarRight
            selected={selected}
            onUpdateProperty={handleUpdateProperty}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onAlignCanvas={handleAlignCanvas}
            onLayerChange={handleLayerChange}
          />
        )}
      </div>

      {/* EXPORT PREVIEW MODAL */}
      <EditorPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        renderedPreviewUrl={renderedPreviewUrl}
        currentRecipientIndex={previewRecipientIdx}
        onSelectRecipientIndex={handleSelectRecipientIndex}
        onDownloadPNG={handleDownloadPNG}
        onDownloadPDF={handleDownloadPDF}
        templateName={templateName}
      />
    </div>
  );
}