"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Crop, LoaderCircle, Move, RotateCcw, Sparkles, X, ZoomIn } from "lucide-react";
import type { BrochureMedia } from "@/lib/brochure";
import styles from "./panel.module.css";

const TARGET_RATIO = 4 / 3;

type CropState = { x: number; y: number; zoom: number };

function mediaStyle(state: CropState): React.CSSProperties {
  return {
    objectPosition: `${state.x}% ${state.y}%`,
    transform: `scale(${state.zoom})`,
    transformOrigin: `${state.x}% ${state.y}%`,
  };
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = document.createElement("img");
    image.src = url;
    await image.decode();
    return { image, width: image.naturalWidth, height: image.naturalHeight };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function cropImage(file: File, state: CropState) {
  const loaded = await loadImage(file);
  const { image, width, height } = loaded;
  try {
    let cropWidth = width;
    let cropHeight = height;
    if (width / height > TARGET_RATIO) cropWidth = height * TARGET_RATIO;
    else cropHeight = width / TARGET_RATIO;
    cropWidth /= state.zoom;
    cropHeight /= state.zoom;
    const left = ((width - cropWidth) * state.x) / 100;
    const top = ((height - cropHeight) * state.y) / 100;
    const outputWidth = Math.max(1, Math.min(1600, Math.round(cropWidth)));
    const outputHeight = Math.round(outputWidth / TARGET_RATIO);
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("No pudimos preparar el recorte.");
    context.drawImage(image, left, top, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.92),
    );
    if (!blob) throw new Error("No pudimos generar la imagen.");
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-brochure.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

export function ImageCropDialog({
  file,
  previewUrl,
  onCancel,
  onConfirm,
}: {
  file: File;
  previewUrl: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [state, setState] = useState<CropState>({ x: 50, y: 50, zoom: 1 });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const drag = useCropDrag(state, setState);
  async function confirm() {
    setWorking(true);
    try {
      onConfirm(await cropImage(file, state));
    } catch {
      setError("No pudimos preparar este archivo. Prueba con JPG, PNG o WebP.");
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className={styles.cropBackdrop} role="dialog" aria-modal="true" aria-label="Preparar imagen">
      <section className={styles.cropDialog}>
        <header>
          <div><span>PREPARAR IMAGEN</span><h2>Encuadra antes de subir</h2></div>
          <button type="button" onClick={onCancel} aria-label="Cerrar"><X /></button>
        </header>
        <p className={styles.cropHint}><Sparkles /> Recorte automático 4:3 · salida máxima 1600 × 1200 px · mueve el enfoque y acerca sin perder el original.</p>
        <div className={styles.cropPreview} {...drag}>
          {/* El archivo es local y temporal; no puede pasar por next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Vista previa del recorte" style={mediaStyle(state)} />
          <span><Crop /> Zona visible en el brochure</span>
        </div>
        {error ? <p className={styles.cropError}>{error}</p> : null}
        <div className={styles.cropControls}>
          <Range label="Horizontal" icon={<Move />} value={state.x} min={0} max={100} onChange={(x) => setState({ ...state, x })} />
          <Range label="Vertical" icon={<Move />} value={state.y} min={0} max={100} onChange={(y) => setState({ ...state, y })} />
          <Range label="Acercamiento" icon={<ZoomIn />} value={state.zoom} min={1} max={2.5} step={0.05} onChange={(zoom) => setState({ ...state, zoom })} />
        </div>
        <footer>
          <button type="button" className={styles.cropReset} onClick={() => setState({ x: 50, y: 50, zoom: 1 })}><RotateCcw /> Automático</button>
          <button type="button" className={styles.primaryButton} onClick={() => void confirm()} disabled={working}>{working ? <LoaderCircle className={styles.spin} /> : <Crop />} Recortar y subir</button>
        </footer>
      </section>
    </div>
  );
}

export function FramingDialog({
  item,
  onCancel,
  onConfirm,
}: {
  item: BrochureMedia;
  onCancel: () => void;
  onConfirm: (patch: Pick<BrochureMedia, "positionX" | "positionY" | "zoom">) => void;
}) {
  const [state, setState] = useState<CropState>({
    x: item.positionX ?? 50,
    y: item.positionY ?? 50,
    zoom: item.zoom ?? 1,
  });
  const drag = useCropDrag(state, setState);
  return (
    <div className={styles.cropBackdrop} role="dialog" aria-modal="true" aria-label="Ajustar encuadre">
      <section className={styles.cropDialog}>
        <header><div><span>ENCUADRE DINÁMICO</span><h2>{item.title || "Multimedia"}</h2></div><button type="button" onClick={onCancel} aria-label="Cerrar"><X /></button></header>
        <p className={styles.cropHint}><Sparkles /> Este ajuste no modifica ni comprime el archivo original.</p>
        <div className={styles.cropPreview} {...drag}>
          {item.kind === "image" ? (
            <Image src={item.url} alt="Vista previa" fill unoptimized sizes="min(90vw, 760px)" style={mediaStyle(state)} />
          ) : (
            <video src={item.url} muted playsInline autoPlay loop style={mediaStyle(state)} />
          )}
          <span><Crop /> Vista final aproximada</span>
        </div>
        <div className={styles.cropControls}>
          <Range label="Horizontal" icon={<Move />} value={state.x} min={0} max={100} onChange={(x) => setState({ ...state, x })} />
          <Range label="Vertical" icon={<Move />} value={state.y} min={0} max={100} onChange={(y) => setState({ ...state, y })} />
          <Range label="Acercamiento" icon={<ZoomIn />} value={state.zoom} min={1} max={2.5} step={0.05} onChange={(zoom) => setState({ ...state, zoom })} />
        </div>
        <footer><button type="button" className={styles.cropReset} onClick={() => setState({ x: 50, y: 50, zoom: 1 })}><RotateCcw /> Restablecer</button><button type="button" className={styles.primaryButton} onClick={() => onConfirm({ positionX: state.x, positionY: state.y, zoom: state.zoom })}><Crop /> Aplicar encuadre</button></footer>
      </section>
    </div>
  );
}

function Range({ label, icon, value, min, max, step = 1, onChange }: { label: string; icon: React.ReactNode; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label><span>{icon}{label}<b>{step < 1 ? `${value.toFixed(2)}×` : `${Math.round(value)}%`}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function useCropDrag(
  state: CropState,
  setState: React.Dispatch<React.SetStateAction<CropState>>,
) {
  const start = useRef<{ x: number; y: number; pointerX: number; pointerY: number } | null>(null);
  return {
    onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
      start.current = { x: state.x, y: state.y, pointerX: event.clientX, pointerY: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
      if (!start.current) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = start.current.x - ((event.clientX - start.current.pointerX) / bounds.width) * 100;
      const y = start.current.y - ((event.clientY - start.current.pointerY) / bounds.height) * 100;
      setState((current) => ({ ...current, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }));
    },
    onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
      start.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
  };
}
