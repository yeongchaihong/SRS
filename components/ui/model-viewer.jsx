import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MovingBorder from "@/components/ui/moving-border";

export default function ModelViewer({ 
  src = "/3d-model/stylizedhumanheart.glb", 
  alt = "3D model", 
  className = "", 
  style = {}, 
  rotationPerSecond = 2.5, 
  interactiveOnHover = true, 
  cameraControls = true, 
  onUserInteract = null 
}) {
  const [ready, setReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = React.useRef(null);
  const wrapperRef = React.useRef(null);

  const mergedStyle = Object.assign({ width: '100%', height: '100%', display: 'block', pointerEvents: 'auto' }, style || {});

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load model-viewer script if missing
    const existing = document.querySelector('script[src*="model-viewer"]');
    if (!existing) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      s.onload = () => setReady(true);
      s.onerror = () => setReady(false);
      document.head.appendChild(s);
    } else {
      setReady(true);
    }

    // Preload assets
    try {
      const fallbackImage = src.replace(/\.gltf?$|\.glb$/i, ".jpg");
      if (!document.querySelector(`link[rel="preload"][href="${src}"]`)) {
        const l = document.createElement('link');
        l.rel = 'preload'; l.href = src; l.as = 'fetch'; l.crossOrigin = 'anonymous';
        document.head.appendChild(l);
      }
      if (!document.querySelector(`link[rel="preload"][href="${fallbackImage}"]`)) {
        const lp = document.createElement('link');
        lp.rel = 'preload'; lp.href = fallbackImage; lp.as = 'image';
        document.head.appendChild(lp);
      }
    } catch (_) { }
  }, [src]);

  useEffect(() => {
    const el = modelRef.current;
    if (!el) return;

    try {
      el.setAttribute("src", src);
      el.setAttribute("alt", alt);
      
      if (cameraControls) {
        try { el.setAttribute("camera-controls", ""); el.cameraControls = true; } catch (_) { }
      } else {
        try { el.removeAttribute('camera-controls'); el.cameraControls = false; } catch (_) { }
      }

      el.setAttribute("auto-rotate", "");
      el.setAttribute("rotation-per-second", String(rotationPerSecond));
      el.setAttribute("exposure", "1");
      el.setAttribute("shadow-intensity", "1");
      el.setAttribute("interaction-prompt", "none");

      // Set properties
      try {
        el.src = src;
        el.alt = alt;
        try { el.cameraControls = Boolean(cameraControls); } catch (_) { }
        el.autoRotate = true;
        el.rotationPerSecond = Number(rotationPerSecond);
        el.exposure = 1;
        el.shadowIntensity = 1;
        try { el.interactionPrompt = 'none'; } catch (_) { }
      } catch (_) { }
    } catch (_) { }

    // Hover interaction logic
    let onEnter, onLeave;
    const wantHover = typeof interactiveOnHover !== 'undefined' ? interactiveOnHover : true;
    if (!cameraControls && wantHover) {
      onEnter = () => { try { el.setAttribute('camera-controls', ''); el.cameraControls = true; } catch (e) { } };
      onLeave = () => { try { el.removeAttribute('camera-controls'); el.cameraControls = false; } catch (e) { } };
      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointerleave', onLeave);
    }

    // --- CRITICAL FIX: REMOVED GLOBAL WINDOW LISTENERS ---
    // We only attach listeners to the ELEMENT itself to prevent it from blocking page scroll
    // unless the mouse is specifically interacting with the model.

    const preventDefaultHandler = (ev) => {
      // Only prevent default if we are strictly over the element
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) { }
    };

    try {
      let loadedHandler = () => { try { setModelLoaded(true); } catch (_) { } };
      el.addEventListener('load', loadedHandler);

      // Add listeners ONLY to the element (el), NOT window
      el.addEventListener('wheel', preventDefaultHandler, { passive: false, capture: true });
      el.addEventListener('touchstart', preventDefaultHandler, { passive: false, capture: true });
      
      // User Interaction Callbacks
      let _pd = null, _pu = null;
      if (onUserInteract && typeof onUserInteract === 'function') {
        _pd = (ev) => { try { onUserInteract({ type: 'pointerdown', originalEvent: ev }); } catch (_) { } };
        _pu = (ev) => { try { onUserInteract({ type: 'pointerup', originalEvent: ev }); } catch (_) { } };
        el.addEventListener('pointerdown', _pd, { capture: true });
        el.addEventListener('pointerup', _pu, { capture: true });
      }
    } catch (_) { }

    return () => {
      try {
        if (onEnter) el.removeEventListener('pointerenter', onEnter);
        if (onLeave) el.removeEventListener('pointerleave', onLeave);
        el.removeEventListener('wheel', preventDefaultHandler, { capture: true });
        el.removeEventListener('touchstart', preventDefaultHandler, { capture: true });
      } catch (_) { }
    };
  }, [src, alt, rotationPerSecond, interactiveOnHover, cameraControls, onUserInteract]);

  // Animation Loop for fallback wrapper
  React.useEffect(() => {
    let rafId = null;
    const ref = wrapperRef.current;
    let angle = 0;
    function loop() {
      angle = (angle + 1.8) % 360;
      if (ref && !modelLoaded) {
        try { ref.style.transform = `rotateY(${angle}deg)`; } catch (_) { }
        rafId = requestAnimationFrame(loop);
      }
    }
    if (!modelLoaded && ref) rafId = requestAnimationFrame(loop);
    if (modelLoaded && ref) try { ref.style.transform = 'none'; } catch (_) { }
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [modelLoaded]);

  const fallbackImage = src ? src.replace(/\.gltf?$|\.glb$/i, ".jpg") : null;

  // STYLES
  const backdropStyle = {
    position: 'absolute', inset: 0, borderRadius: '12px', pointerEvents: 'none', zIndex: 12,
    background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0.00) 70%)'
  };
  const frameStyle = {
    position: 'absolute', left: '-48px', top: '-48px', width: 'calc(100% + 96px)', height: 'calc(100% + 96px)',
    borderRadius: '10px', border: '2px solid rgba(10,10,10,0.92)', pointerEvents: 'none', zIndex: 11, boxSizing: 'border-box',
  };
  const modelStyle = Object.assign({}, mergedStyle, {
    zIndex: 9999, position: 'relative', background: 'transparent',
    filter: 'drop-shadow(0 30px 60px rgba(2,6,23,0.35))', maxWidth: 'none', maxHeight: 'none',
    transformStyle: 'preserve-3d', willChange: 'transform',
  });
  const dotWrapperStyle = { width: 36, height: 36, position: 'relative', pointerEvents: 'none', transform: 'translateZ(0)' };
  const haloStyle = { position: 'absolute', inset: 0, borderRadius: 9999, background: 'radial-gradient(circle at 50% 40%, rgba(34,211,238,0.9) 0%, rgba(34,211,238,0.45) 28%, rgba(6,182,212,0.12) 55%, transparent 80%)', filter: 'blur(12px)', opacity: 0.98, pointerEvents: 'none' };
  const coreStyle = { position: 'absolute', top: '50%', left: '50%', width: 12, height: 12, transform: 'translate(-50%,-50%)', borderRadius: 9999, background: '#ecfeff', boxShadow: '0 8px 28px rgba(6,182,212,0.45)', pointerEvents: 'none' };

  if (!src) return null; // Simplified error state for brevity

  return (
    <div style={{ width: mergedStyle.width, height: mergedStyle.height, position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <div style={frameStyle} aria-hidden="true">
        <MovingBorder duration={7000} rx={10} ry={10}>
          <div style={dotWrapperStyle}>
            <div style={haloStyle} />
            <motion.div style={coreStyle} animate={{ scale: [1, 1.25, 1], opacity: [1, 0.85, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
        </MovingBorder>
      </div>
      <div style={backdropStyle} />
      <model-viewer
        ref={modelRef}
        className={className}
        style={modelStyle}
        src={src}
        alt={alt}
        poster={fallbackImage}
        auto-rotate
        rotation-per-second={String(rotationPerSecond)}
        interaction-prompt="none"
        exposure={1}
      />
      {!modelLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
           <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
           </div>
        </div>
      )}
    </div>
  );
}