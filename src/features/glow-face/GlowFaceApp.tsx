// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Download, RefreshCw, X, Grid, Sliders } from 'lucide-react';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      const handleLoad = () => {
        existing.dataset.loaded = 'true';
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
        resolve();
      };
      const handleError = () => {
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
        reject(new Error(`loadScript failed: ${src}`));
      };
      existing.addEventListener('load', handleLoad);
      existing.addEventListener('error', handleError);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`loadScript failed: ${src}`));
    document.body.appendChild(script);
  });
};

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const MEDIAPIPE_FACE_MESH_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/';
const MEDIAPIPE_HANDS_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/';

const resolveMediaPipeAsset = (file) => {
  if (file.startsWith('hands_')) return `${MEDIAPIPE_HANDS_BASE}${file}`;
  if (file.startsWith('face_mesh_')) return `${MEDIAPIPE_FACE_MESH_BASE}${file}`;
  return `${MEDIAPIPE_FACE_MESH_BASE}${file}`;
};

const resolveHandsAsset = (file) => {
  if (file.startsWith('face_mesh_')) return `${MEDIAPIPE_FACE_MESH_BASE}${file}`;
  if (file.startsWith('hands_')) return `${MEDIAPIPE_HANDS_BASE}${file}`;
  return `${MEDIAPIPE_HANDS_BASE}${file}`;
};

const FILTER_PRESETS = [
  {
    id: 'natural', name: 'ธรรมชาติ', emoji: '🌿',
    defaultConfig: { brightness: 1.10, contrast: 1.05, blur: 0.5, saturation: 1.05, maskFeather: 15, faceScale: 1.01, foreheadScale: 1.25, hueRotate: 0 }
  },
  {
    id: 'bright', name: 'สดใส', emoji: '✨',
    defaultConfig: { brightness: 1.15, contrast: 1.08, blur: 0.8, saturation: 1.1, maskFeather: 20, faceScale: 1.02, foreheadScale: 1.30, hueRotate: 0 }
  },
  {
    id: 'smooth', name: 'ผิวเนียน', emoji: '🪷',
    defaultConfig: { brightness: 1.08, contrast: 1.02, blur: 2.0, saturation: 1.05, maskFeather: 25, faceScale: 1.01, foreheadScale: 1.25, hueRotate: 0 }
  },
  {
    id: 'rosy', name: 'อมชมพู', emoji: '🌸',
    defaultConfig: { brightness: 1.12, contrast: 1.05, blur: 0.8, saturation: 1.2, maskFeather: 15, faceScale: 1.01, foreheadScale: 1.25, hueRotate: 5 }
  },
];

const SLIDER_DEFS = [
  { key: 'brightness',    label: 'ความสว่าง',   min: 0.7, max: 1.5, step: 0.01, unit: 'x'   },
  { key: 'contrast',      label: 'คอนทราสต์',  min: 0.7, max: 1.5, step: 0.01, unit: 'x'   },
  { key: 'saturation',    label: 'สีสัน',        min: 0.5, max: 2.0, step: 0.01, unit: 'x'   },
  { key: 'blur',          label: 'ผิวเนียน',    min: 0.0, max: 4.0, step: 0.1,  unit: 'px'  },
  { key: 'hueRotate',     label: 'โทนสี',       min: 0,   max: 30,  step: 1,    unit: 'deg' },
  { key: 'foreheadScale', label: 'ยืดหน้าผาก', min: 1.0, max: 1.8, step: 0.01, unit: 'x'   },
  { key: 'faceScale',     label: 'ขนาดรวม',    min: 0.8, max: 1.2, step: 0.01, unit: 'x'   },
  { key: 'maskFeather',   label: 'ความฟุ้งขอบ',min: 0,   max: 50,  step: 1,    unit: 'px'  },
];

const SLIDER_DEF_MAP = SLIDER_DEFS.reduce((acc, def) => {
  acc[def.key] = def;
  return acc;
}, {});
const CONFIG_KEYS = SLIDER_DEFS.map(def => def.key);

const buildInitialConfigs = () => {
  const out = {};
  FILTER_PRESETS.forEach(p => { out[p.id] = { ...p.defaultConfig }; });
  return out;
};

const drawHandOverlay = (ctx, handResults, width, height) => {
  if (!handResults?.multiHandLandmarks?.length) return;

  handResults.multiHandLandmarks.forEach((landmarks, handIdx) => {
    const handedness = handResults.multiHandedness?.[handIdx]?.label;
    const color = handedness === 'Left' ? 'rgba(251,113,133,0.95)' : 'rgba(34,211,238,0.95)';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    HAND_CONNECTIONS.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      if (!p1 || !p2) return;
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    });

    ctx.fillStyle = '#ffffff';
    landmarks.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  });
};

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFilterEnabled, setIsFilterEnabled] = useState(true);
  const [isMeshEnabled, setIsMeshEnabled] = useState(false);
  const [isHandEnabled, setIsHandEnabled] = useState(false);
  const [handWarning, setHandWarning] = useState(null);
  const [selectedFilterId, setSelectedFilterId] = useState('natural');
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [filterConfigs, setFilterConfigs] = useState(buildInitialConfigs);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonStatus, setJsonStatus] = useState({ type: null, message: '' });
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('เริ่มต้นระบบ...');

  const isFilterEnabledRef = useRef(true);
  const isMeshEnabledRef = useRef(false);
  const isHandEnabledRef = useRef(false);
  const handModelReadyRef = useRef(false);
  const latestHandsRef = useRef({ multiHandLandmarks: [], multiHandedness: [] });
  const selectedFilterIdRef = useRef('natural');
  const filterConfigsRef = useRef(filterConfigs);

  useEffect(() => { isFilterEnabledRef.current = isFilterEnabled; }, [isFilterEnabled]);
  useEffect(() => { isMeshEnabledRef.current = isMeshEnabled; }, [isMeshEnabled]);
  useEffect(() => { isHandEnabledRef.current = isHandEnabled; }, [isHandEnabled]);
  useEffect(() => { selectedFilterIdRef.current = selectedFilterId; }, [selectedFilterId]);
  useEffect(() => { filterConfigsRef.current = filterConfigs; }, [filterConfigs]);

  const setInitProgress = useCallback((nextProgress, stageText) => {
    const clamped = Math.max(0, Math.min(100, nextProgress));
    setLoadingProgress(prev => Math.max(prev, clamped));
    if (stageText) setLoadingStage(stageText);
  }, []);

  const handleConfigChange = useCallback((filterId, key, val) => {
    setFilterConfigs(prev => ({ ...prev, [filterId]: { ...prev[filterId], [key]: val } }));
  }, []);

  const handleResetConfig = useCallback((filterId) => {
    const preset = FILTER_PRESETS.find(p => p.id === filterId);
    if (preset) setFilterConfigs(prev => ({ ...prev, [filterId]: { ...preset.defaultConfig } }));
  }, []);

  const handleExportJson = useCallback(async () => {
    const payload = {
      version: 1,
      filterId: selectedFilterId,
      config: filterConfigs[selectedFilterId] || {},
    };
    const json = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setJsonStatus({ type: 'success', message: 'คัดลอก JSON แล้ว' });
    } catch (_) {
      setJsonInput(json);
      setJsonStatus({ type: 'error', message: 'คัดลอกอัตโนมัติไม่สำเร็จ วางให้แล้ว กรุณา copy เอง' });
    }
  }, [filterConfigs, selectedFilterId]);

  const validateImportPayload = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'รูปแบบ JSON ไม่ถูกต้อง' };
    if (payload.version !== 1) return { ok: false, error: 'รองรับเฉพาะ version: 1' };
    if (payload.filterId !== selectedFilterId) return { ok: false, error: 'filterId ไม่ตรงกับ filter ที่เลือก' };
    if (!payload.config || typeof payload.config !== 'object' || Array.isArray(payload.config)) return { ok: false, error: 'config ต้องเป็น object' };

    const keys = Object.keys(payload.config);
    if (keys.length !== CONFIG_KEYS.length) return { ok: false, error: 'schema ไม่ถูกต้อง: จำนวน key ไม่ครบ' };

    for (const key of CONFIG_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(payload.config, key)) return { ok: false, error: `schema ไม่ถูกต้อง: ขาด key ${key}` };
    }
    for (const key of keys) {
      if (!SLIDER_DEF_MAP[key]) return { ok: false, error: `schema ไม่ถูกต้อง: key เกิน ${key}` };
    }

    const sanitized = {};
    for (const key of CONFIG_KEYS) {
      const value = payload.config[key];
      const def = SLIDER_DEF_MAP[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, error: `ค่า ${key} ต้องเป็นตัวเลข` };
      if (value < def.min || value > def.max) return { ok: false, error: `ค่าของ ${key} เกินช่วง ${def.min}-${def.max}` };
      if (def.step >= 1 && !Number.isInteger(value)) return { ok: false, error: `ค่า ${key} ต้องเป็นจำนวนเต็ม` };
      sanitized[key] = value;
    }

    return { ok: true, config: sanitized };
  }, [selectedFilterId]);

  const handleImportJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      const result = validateImportPayload(parsed);
      if (!result.ok) {
        setJsonStatus({ type: 'error', message: result.error });
        return;
      }
      setFilterConfigs(prev => ({ ...prev, [selectedFilterId]: result.config }));
      setJsonStatus({ type: 'success', message: 'นำเข้า config สำเร็จ' });
    } catch (_) {
      setJsonStatus({ type: 'error', message: 'JSON parse ไม่สำเร็จ' });
    }
  }, [jsonInput, selectedFilterId, validateImportPayload]);

  const getExpandedOvalPoints = (landmarks, indices, width, height, scale, foreheadScale) => {
    const points = indices.map(i => ({ x: landmarks[i].x * width, y: landmarks[i].y * height }));
    let sumX = 0;
    let sumY = 0;
    points.forEach(p => { sumX += p.x; sumY += p.y; });
    const cx = sumX / points.length;
    const cy = sumY / points.length;
    return points.map(p => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      return { x: cx + dx * scale, y: cy + dy * (dy < 0 ? scale * foreheadScale : scale) };
    });
  };

  useEffect(() => {
    let camera = null;
    let faceMesh = null;
    let hands = null;
    let isUnmounted = false;
    const faceOvalIndices = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

    const init = async () => {
      try {
        if (!isUnmounted) {
          setCameraError(null);
          setIsInitializing(true);
          setInitProgress(0, 'เริ่มต้นระบบ...');
          setHandWarning(null);
        }

        setInitProgress(10, 'กำลังตรวจสอบกล้อง...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(t => t.stop());
        } catch (camErr) {
          throw new Error(`❌ กล้อง: ${camErr.message}\n\nวิธีแก้: กด Allow กล้องใน browser แล้ว refresh`);
        }

        setInitProgress(25, 'กำลังโหลด FaceMesh...');
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
          setInitProgress(45, 'กำลังโหลด Camera Utils...');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        } catch (_) {
          throw new Error('❌ โหลด MediaPipe ไม่ได้: เช็ค internet หรือ CDN ถูก block');
        }

        setInitProgress(60, 'กำลังโหลด Hands...');
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        } catch (_) {
          if (!isUnmounted) {
            setHandWarning('ไม่สามารถโหลด Hand overlay ได้ ระบบใบหน้ายังใช้งานได้ปกติ');
          }
        }

        if (!window.FaceMesh || !window.Camera) throw new Error('❌ MediaPipe โหลดไม่สมบูรณ์ ลอง refresh');

        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        if (!videoEl || !canvasEl) return;

        const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
        offscreenCanvasRef.current = document.createElement('canvas');
        const offCanvas = offscreenCanvasRef.current;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        setInitProgress(70, 'กำลังตั้งค่าโมเดล...');
        faceMesh = new window.FaceMesh({ locateFile: resolveMediaPipeAsset });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

        if (window.Hands) {
          hands = new window.Hands({ locateFile: resolveHandsAsset });
          hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
          hands.onResults((results) => {
            latestHandsRef.current = {
              multiHandLandmarks: results.multiHandLandmarks || [],
              multiHandedness: results.multiHandedness || [],
            };
          });
          handModelReadyRef.current = true;
        } else {
          handModelReadyRef.current = false;
          latestHandsRef.current = { multiHandLandmarks: [], multiHandedness: [] };
          if (!isUnmounted) {
            setHandWarning('Hand overlay ไม่พร้อมใช้งานในอุปกรณ์นี้');
          }
        }

        faceMesh.onResults(results => {
          if (isUnmounted || !canvasRef.current) return;
          const W = canvasEl.width;
          const H = canvasEl.height;
          if (offCanvas.width !== W) {
            offCanvas.width = W;
            offCanvas.height = H;
          }

          ctx.save();
          ctx.clearRect(0, 0, W, H);
          ctx.drawImage(results.image, 0, 0, W, H);
          ctx.restore();

          const filterOn = isFilterEnabledRef.current;
          const meshOn = isMeshEnabledRef.current;
          const handOn = isHandEnabledRef.current && handModelReadyRef.current;
          if (!filterOn && !meshOn && !handOn) return;

          const landmarks = results.multiFaceLandmarks?.[0];
          const hasFace = !!landmarks;

          if (hasFace) {
            const fid = selectedFilterIdRef.current;
            const cfg = filterConfigsRef.current[fid] || FILTER_PRESETS[0].defaultConfig;
            const ovalPoints = getExpandedOvalPoints(landmarks, faceOvalIndices, W, H, cfg.faceScale, cfg.foreheadScale);

            if (filterOn) {
              offCtx.save();
              offCtx.clearRect(0, 0, W, H);
              offCtx.filter = `brightness(${cfg.brightness}) contrast(${cfg.contrast}) saturate(${cfg.saturation}) blur(${cfg.blur}px) hue-rotate(${cfg.hueRotate}deg)`;
              offCtx.drawImage(results.image, 0, 0, W, H);
              offCtx.filter = 'none';
              offCtx.globalCompositeOperation = 'destination-in';
              offCtx.beginPath();
              ovalPoints.forEach((p, i) => i === 0 ? offCtx.moveTo(p.x, p.y) : offCtx.lineTo(p.x, p.y));
              offCtx.closePath();
              offCtx.filter = `blur(${cfg.maskFeather}px)`;
              offCtx.fillStyle = 'white';
              offCtx.fill();
              offCtx.restore();
              ctx.drawImage(offCanvas, 0, 0);
            }

            if (meshOn) {
              ctx.save();
              ctx.beginPath();
              ctx.lineWidth = 2;
              ctx.strokeStyle = 'rgba(0,255,255,0.8)';
              ovalPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.stroke();
              ctx.restore();
            }
          }

          if (handOn) {
            drawHandOverlay(ctx, latestHandsRef.current, W, H);
          }
        });

        setInitProgress(85, 'กำลังเริ่มกล้อง...');
        camera = new window.Camera(videoEl, {
          onFrame: async () => {
            if (isUnmounted) return;
            if (faceMesh) {
              try {
                await faceMesh.send({ image: videoEl });
              } catch (faceErr) {
                console.error('FaceMesh frame error:', faceErr);
              }
            }
            if (hands && handModelReadyRef.current) {
              try {
                await hands.send({ image: videoEl });
              } catch (handErr) {
                console.error('Hands frame error:', handErr);
              }
            }
          },
          width: 1280,
          height: 720,
        });

        await camera.start();
        if (!isUnmounted) {
          setInitProgress(100, 'พร้อมใช้งาน');
          setIsModelLoaded(true);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error(err);
        if (!isUnmounted) {
          setCameraError(err.message || 'ไม่สามารถเข้าถึงกล้อง หรือโหลดโมเดลได้');
          setIsInitializing(false);
        }
      }
    };

    init();
    return () => {
      isUnmounted = true;
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
      if (hands) hands.close();
    };
  }, [setInitProgress]);

  const takePhoto = () => {
    if (canvasRef.current) setCapturedImage(canvasRef.current.toDataURL('image/jpeg', 0.95));
  };

  const downloadPhoto = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `glowface-${selectedFilterId}-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentConfig = filterConfigs[selectedFilterId] || {};
  const currentPreset = FILTER_PRESETS.find(p => p.id === selectedFilterId);

  const s = {
    page: { minHeight: '100vh', backgroundColor: '#0f0f0f', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '32px 16px' },
    card: { background: '#111827', border: '1px solid #1f2937', borderRadius: 16 },
    btn: (active, activeColor) => ({
      width: 44,
      height: 44,
      borderRadius: '50%',
      border: active ? `1px solid ${activeColor}40` : '1px solid #374151',
      background: active ? `${activeColor}20` : 'rgba(31,41,55,0.7)',
      color: active ? activeColor : '#9ca3af',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    }),
  };

  const isHandAvailable = !handWarning && handModelReadyRef.current;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 980px){
          .gf-workspace{grid-template-columns:1fr !important}
          .gf-sidebar{position:static !important;max-height:none !important}
        }
      `}</style>

      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, background: 'linear-gradient(to right,#ec4899,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GlowFace AI
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>Beauty filter — ปรับค่าได้แยกทุก filter</p>
        </div>
        {isModelLoaded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#1f2937', borderRadius: 99, border: '1px solid #374151' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isFilterEnabled ? '#34d399' : '#4b5563', display: 'inline-block', boxShadow: isFilterEnabled ? '0 0 6px #34d399' : 'none' }} />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{isFilterEnabled ? 'Filter ON' : 'Filter OFF'}</span>
          </div>
        )}
      </div>

      {handWarning && isModelLoaded && (
        <p style={{ margin: '0 0 16px', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(245,158,11,0.12)', color: '#fcd34d', fontSize: 12 }}>
          {handWarning}
        </p>
      )}

      <div
        className="gf-workspace"
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isModelLoaded && showAdjustPanel ? 'minmax(0,1fr) 340px' : '1fr',
          gap: 16,
          alignItems: 'start',
          marginBottom: 24
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* Camera Area */}
          <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', borderRadius: 16, overflow: 'hidden', border: '1px solid #1f2937', marginBottom: 16 }}>
            {isInitializing && !cameraError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', zIndex: 20, gap: 10, padding: 24 }}>
                <div style={{ width: 48, height: 48, border: '2px solid transparent', borderTopColor: '#ec4899', borderBottomColor: '#ec4899', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#d1d5db', fontSize: 14, margin: 0 }}>{loadingStage}</p>
                <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>{loadingProgress}%</p>
                <div style={{ width: 'min(320px, 80%)', height: 8, background: '#1f2937', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${loadingProgress}%`, height: '100%', background: 'linear-gradient(to right,#ec4899,#22d3ee)', transition: 'width 220ms ease' }} />
                </div>
              </div>
            )}
            {cameraError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: 24, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                  <p style={{ color: '#f87171', fontSize: 16, margin: '0 0 8px' }}>⚠️ เกิดข้อผิดพลาด</p>
                  <p style={{ color: '#d1d5db', fontSize: 13, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{cameraError}</p>
                  <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>ลองใหม่</button>
                </div>
              </div>
            )}
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
            <canvas ref={canvasRef} width={1280} height={720} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />

            {isModelLoaded && (
              <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, zIndex: 10 }}>
                <button onClick={() => setIsMeshEnabled(v => !v)} style={s.btn(isMeshEnabled, '#22d3ee')} title="Mesh">
                  <Grid size={18} />
                </button>
                <button onClick={() => setIsFilterEnabled(v => !v)} style={s.btn(isFilterEnabled, '#34d399')} title="Filter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsHandEnabled(v => !v)}
                  style={{ ...s.btn(isHandEnabled, '#f59e0b'), opacity: isHandAvailable ? 1 : 0.45, pointerEvents: isHandAvailable ? 'auto' : 'none' }}
                  title="Hands"
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>H</span>
                </button>
                <button onClick={takePhoto} style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', border: '4px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6' }} />
                </button>
                <button onClick={() => setShowAdjustPanel(v => !v)} style={s.btn(showAdjustPanel, '#ec4899')} title="ปรับแต่ง">
                  <Sliders size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          {isModelLoaded && (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                {FILTER_PRESETS.map(f => (
                  <button key={f.id} onClick={() => setSelectedFilterId(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: '1px solid', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderColor: selectedFilterId === f.id ? '#ec4899' : '#374151', background: selectedFilterId === f.id ? '#db2777' : '#1f2937', color: selectedFilterId === f.id ? '#fff' : '#d1d5db', opacity: !isFilterEnabled ? 0.4 : 1, pointerEvents: !isFilterEnabled ? 'none' : 'auto' }}>
                    <span>{f.emoji}</span><span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Adjust Panel (Sidebar) */}
        {isModelLoaded && showAdjustPanel && (
          <div className="gf-sidebar" style={{ ...s.card, overflow: 'hidden', position: 'sticky', top: 16, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{currentPreset ? currentPreset.emoji : ''}</span>
                <span style={{ fontWeight: 600 }}>{currentPreset ? currentPreset.name : ''}</span>
              </div>
              <button
                onClick={() => {
                  handleResetConfig(selectedFilterId);
                  setJsonStatus({ type: null, message: '' });
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af', background: 'transparent', border: '1px solid #374151', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
              >
                <RefreshCw size={12} /> รีเซ็ต
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, padding: 20 }}>
              {SLIDER_DEFS.map(({ key, label, min, max, step, unit }) => {
                const val = currentConfig[key] !== undefined ? currentConfig[key] : (FILTER_PRESETS[0].defaultConfig[key] || 0);
                const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
                const display = step >= 1 ? Math.round(val) : Number(val).toFixed(2);
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#f472b6', background: 'rgba(236,72,153,0.12)', padding: '2px 8px', borderRadius: 6 }}>{display}{unit}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={val}
                      onChange={e => handleConfigChange(selectedFilterId, key, step >= 1 ? parseInt(e.target.value, 10) : parseFloat(e.target.value))}
                      style={{ width: '100%', height: 4, appearance: 'none', borderRadius: 99, cursor: 'pointer', background: `linear-gradient(to right,#ec4899 ${pct}%,#374151 ${pct}%)`, accentColor: '#ec4899' }}
                    />
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 10, color: '#4b5563', padding: '0 20px 16px', margin: 0 }}>
              💡 ค่าที่ปรับจะบันทึกแยกสำหรับแต่ละ filter ตลอด session นี้
            </p>

            <div style={{ borderTop: '1px solid #1f2937', padding: 20, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Export / Import JSON</span>
                <button
                  onClick={handleExportJson}
                  style={{ fontSize: 12, color: '#d1d5db', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
                >
                  Export JSON
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste JSON here..."
                style={{
                  width: '100%',
                  minHeight: 120,
                  resize: 'vertical',
                  background: '#0b1220',
                  color: '#d1d5db',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  padding: 10,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 12,
                  lineHeight: 1.4
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleImportJson}
                  style={{ fontSize: 12, color: '#fff', background: '#db2777', border: '1px solid #ec4899', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
                >
                  Import JSON
                </button>
                {jsonStatus.type && (
                  <span style={{ fontSize: 12, color: jsonStatus.type === 'success' ? '#34d399' : '#f87171' }}>
                    {jsonStatus.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {capturedImage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ ...s.card, maxWidth: 896, width: '100%', padding: 16, position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
              <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scaleX(-1)' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={downloadPhoto} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', background: '#db2777', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                <Download size={16} /> บันทึกรูปภาพ
              </button>
              <button onClick={() => setCapturedImage(null)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', background: '#1f2937', color: '#d1d5db', border: 'none', borderRadius: 12, fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                <RefreshCw size={14} /> ถ่ายใหม่
              </button>
            </div>
            <button onClick={() => setCapturedImage(null)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: '#1f2937', border: 'none', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
