import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Navigation,
  Send,
  Contact2,
  Camera,
  RefreshCw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ARCard } from '../../types';
import { StorageService } from '../../utils/storage';
import { downloadVCard } from '../../utils/vcard';

interface WebARViewerProps {
  card: ARCard;
  onClose: () => void;
}

export const WebARViewer: React.FC<WebARViewerProps> = ({ card, onClose }) => {
  // Mode & Camera states
  const [viewMode, setViewMode] = useState<'camera' | 'studio'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Tracking & Audio states
  const [isTargetLocked, setIsTargetLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // RSVP Modal states
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [attending, setAttending] = useState(true);
  const [plusOne, setPlusOne] = useState(false);
  const [dietary, setDietary] = useState('');

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const augmentedVideoRef = useRef<HTMLVideoElement>(null);

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cardGroup: THREE.Group;
    particles: THREE.Points | null;
    animationFrameId: number;
  } | null>(null);

  // Rotation target for gyro/touch
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Record initial scan
  useEffect(() => {
    StorageService.recordScan(card.id);
  }, [card.id]);

  // 1. Initialize Camera Stream (getUserMedia)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Switching to Studio Preview.');
      setViewMode('studio');
      return;
    }

    try {
      // Stop any existing tracks
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        const stream = cameraVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Tap "Studio Preview" to explore without camera.'
          : 'Unable to start camera stream. Falling back to Studio Preview.'
      );
      setViewMode('studio');
    }
  }, [cameraFacing]);

  useEffect(() => {
    if (viewMode === 'camera') {
      startCamera();
    } else {
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        const stream = cameraVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        cameraVideoRef.current.srcObject = null;
      }
      setCameraActive(false);
    }

    return () => {
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        const stream = cameraVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [viewMode, startCamera]);

  // Flip camera (environment <-> user)
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // 2. Initialize Three.js 3D Spatial Stage
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Renderer (Alpha true for transparent overlay over live camera)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const goldDirectionalLight = new THREE.DirectionalLight(0xd4af37, 2.0);
    goldDirectionalLight.position.set(3, 5, 4);
    scene.add(goldDirectionalLight);

    const softFillLight = new THREE.PointLight(0xffffff, 0.8, 10);
    softFillLight.position.set(-3, -2, 3);
    scene.add(softFillLight);

    // Card 3D Group
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    // Card Dimensions: Standard 3:4 portrait aspect ratio
    const cardWidth = 2.2;
    const cardHeight = 3.0;

    // 1) Augmented Video Texture Plane
    let videoTexture: THREE.VideoTexture | null = null;
    if (augmentedVideoRef.current && card.videoUrl) {
      videoTexture = new THREE.VideoTexture(augmentedVideoRef.current);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.colorSpace = THREE.SRGBColorSpace;
    }

    const planeMaterial = videoTexture
      ? new THREE.MeshBasicMaterial({
          map: videoTexture,
          side: THREE.DoubleSide
        })
      : new THREE.MeshStandardMaterial({
          color: 0x1a1a1c,
          roughness: 0.4,
          metalness: 0.1
        });

    const cardPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth, cardHeight),
      planeMaterial
    );
    cardGroup.add(cardPlane);

    // 2) Champagne Gold Chamfered Metallic Frame
    const frameGeometry = new THREE.PlaneGeometry(cardWidth + 0.12, cardHeight + 0.12);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.18,
      side: THREE.DoubleSide
    });
    const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    frameMesh.position.z = -0.01;
    cardGroup.add(frameMesh);

    // 3) Outer Thin Gold Glowing Border Line
    const edges = new THREE.EdgesGeometry(frameGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffd700,
      linewidth: 2
    });
    const borderLines = new THREE.LineSegments(edges, lineMaterial);
    borderLines.position.z = 0.01;
    cardGroup.add(borderLines);

    // 4) 3D Particles in World Space
    let particlesMesh: THREE.Points | null = null;
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const isRose = card.effect === 'rose_petals';
    const primaryColor = isRose ? new THREE.Color(0xe11d48) : new THREE.Color(0xd4af37);
    const secondaryColor = isRose ? new THREE.Color(0xfb7185) : new THREE.Color(0xfff5c0);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 6;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 6;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 3;

      const c = Math.random() > 0.5 ? primaryColor : secondaryColor;
      particleColors[i3] = c.r;
      particleColors[i3 + 1] = c.g;
      particleColors[i3 + 2] = c.b;
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    // Set Ref
    threeRef.current = {
      scene,
      camera,
      renderer,
      cardGroup,
      particles: particlesMesh,
      animationFrameId: 0
    };

    // Auto Target Lock sequence (simulating spatial acquisition)
    const lockTimer = setTimeout(() => {
      setIsTargetLocked(true);
      triggerConfetti(card.effect);
    }, 1500);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smoothly interpolate card rotation toward target (gyro / pointer drag)
      cardGroup.rotation.x += (targetRotation.current.x - cardGroup.rotation.x) * 0.1;
      cardGroup.rotation.y += (targetRotation.current.y - cardGroup.rotation.y) * 0.1;

      // Gentle floating breathing oscillation
      cardGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      // Rotate and drift particles
      if (particlesMesh) {
        particlesMesh.rotation.y = elapsedTime * 0.08;
        particlesMesh.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1;
      }

      renderer.render(scene, camera);
      threeRef.current!.animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(lockTimer);
      window.removeEventListener('resize', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animationFrameId);
        renderer.dispose();
      }
    };
  }, [card, viewMode]);

  // 3. Device Orientation Listener (Mobile Gyroscope)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // Map beta (forward/back tilt -90 to 90) and gamma (left/right tilt -90 to 90)
        const radX = ((e.beta - 45) * Math.PI) / 180;
        const radY = (e.gamma * Math.PI) / 180;

        // Clamp angle limits for natural card viewing
        targetRotation.current.x = THREE.MathUtils.clamp(radX * 0.5, -0.4, 0.4);
        targetRotation.current.y = THREE.MathUtils.clamp(radY * 0.5, -0.5, 0.5);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // 4. Pointer Drag (Manual Tilt for Desktop or Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    previousPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousPointer.current.x;
    const deltaY = e.clientY - previousPointer.current.y;

    targetRotation.current.y += deltaX * 0.005;
    targetRotation.current.x += deltaY * 0.005;

    // Clamp
    targetRotation.current.x = THREE.MathUtils.clamp(targetRotation.current.x, -0.5, 0.5);
    targetRotation.current.y = THREE.MathUtils.clamp(targetRotation.current.y, -0.6, 0.6);

    previousPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // 5. Confetti helper
  const triggerConfetti = (effect: string) => {
    if (effect === 'rose_petals') {
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#E11D48', '#FB7185', '#F43F5E', '#FFE4E6']
      });
    } else {
      confetti({
        particleCount: 55,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#D4AF37', '#FDE047', '#E5C158', '#FFFFFF']
      });
    }
  };

  // 6. Audio Unmute Gesture (Mobile Browser Autoplay Unlock)
  const handleUnlockAudio = () => {
    setHasInteracted(true);
    setIsMuted(false);
    if (augmentedVideoRef.current) {
      augmentedVideoRef.current.muted = false;
      augmentedVideoRef.current.play().catch(console.warn);
    }
  };

  // 7. RSVP Submit
  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    await StorageService.recordRSVP({
      id: `rsvp-${Date.now()}`,
      cardId: card.id,
      guestName,
      attending,
      plusOne,
      dietary,
      submittedAt: new Date().toISOString()
    });

    setRsvpSubmitted(true);
    triggerConfetti('golden_sparkles');
    setTimeout(() => {
      setIsRSVPOpen(false);
      setRsvpSubmitted(false);
    }, 2000);
  };

  // 8. Contact Download
  const handleDownloadContact = () => {
    if (card.type === 'business') {
      downloadVCard(card);
      StorageService.recordVCardDownload(card.id);
      triggerConfetti('golden_sparkles');
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none touch-none"
    >
      {/* Hidden Augmented Video (Provides Texture to Three.js Plane) */}
      {card.videoUrl && (
        <video
          ref={augmentedVideoRef}
          src={card.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          crossOrigin="anonymous"
          className="hidden"
        />
      )}

      {/* Layer 1: Hardware Camera Stream or Studio Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {viewMode === 'camera' ? (
          <video
            ref={cameraVideoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={card.targetImageUrl}
              alt="Studio Backdrop"
              className="w-full h-full object-cover filter blur-[8px] scale-110 opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
          </div>
        )}
      </div>

      {/* Layer 2: Transparent Three.js WebGL Spatial Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing"
      />

      {/* Layer 3: Holographic Spatial Reticle & Target HUD */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <div
          className={`relative w-[75vw] max-w-[300px] aspect-[3/4] border border-dashed transition-all duration-700 ${
            isTargetLocked
              ? 'border-[#D4AF37]/80 gold-glow'
              : 'border-white/30 animate-pulse'
          }`}
        >
          {/* Corner Brackets */}
          <span className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]"></span>
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]"></span>
          <span className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]"></span>
          <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]"></span>

          {/* Target Status Tag */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#D4AF37]/50 text-[10px] font-bold tracking-widest text-[#D4AF37] flex items-center gap-1.5 shadow-lg">
            <span
              className={`w-2 h-2 rounded-full ${
                isTargetLocked ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
              }`}
            ></span>
            <span>{isTargetLocked ? 'SPATIAL TARGET LOCKED' : 'ALIGN CARD IN FRAME'}</span>
          </div>

          {/* Interactive Hint */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-neutral-300 font-medium bg-black/60 px-3 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
            Drag to tilt card in 3D • Gyroscope active
          </div>
        </div>
      </div>

      {/* Layer 4: Floating Top Navigation HUD */}
      <header className="relative z-30 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-[2px]">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-xs font-semibold text-neutral-200 hover:text-white hover:border-[#D4AF37] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit AR</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#D4AF37] flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>ARGON WebAR Studio</span>
          </span>
          <h2 className="font-serif-luxury text-base font-bold text-white tracking-wide truncate max-w-[200px]">
            {card.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle (Camera vs Studio) */}
          <button
            onClick={() => setViewMode(viewMode === 'camera' ? 'studio' : 'camera')}
            title={viewMode === 'camera' ? 'Switch to Studio Backdrop' : 'Switch to Live Camera'}
            className={`p-2.5 rounded-full border backdrop-blur-md transition-all ${
              viewMode === 'camera'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-black/60 border-white/20 text-neutral-300'
            }`}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Camera Flip Button (Only in camera mode) */}
          {viewMode === 'camera' && cameraActive && (
            <button
              onClick={toggleCameraFacing}
              title="Flip Camera (Front/Back)"
              className="p-2.5 rounded-full bg-black/60 border border-white/20 text-neutral-300 hover:text-white hover:border-[#D4AF37] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (augmentedVideoRef.current) {
                augmentedVideoRef.current.muted = nextMuted;
              }
            }}
            className="p-2.5 rounded-full bg-black/60 border border-white/20 text-neutral-300 hover:text-white transition-all"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#D4AF37]" />
            )}
          </button>
        </div>
      </header>

      {/* Autoplay Audio Unlock Overlay (First Tap) */}
      {!hasInteracted && isMuted && card.videoUrl && (
        <div
          onClick={handleUnlockAudio}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/90 to-[#E5C158]/90 text-neutral-950 font-bold text-xs shadow-xl flex items-center gap-2 cursor-pointer animate-bounce gold-glow"
        >
          <Volume2 className="w-4 h-4" />
          <span>Tap anywhere to unmute spatial audio</span>
        </div>
      )}

      {/* Camera Error / Permission Notice */}
      {cameraError && (
        <div className="absolute top-20 left-4 right-4 z-40 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs text-center backdrop-blur-md">
          {cameraError}
        </div>
      )}

      {/* Layer 5: Floating Bottom Action Controls */}
      <footer className="relative z-30 p-4 sm:p-6 pb-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center gap-3 pointer-events-auto">
        <div className="w-full max-w-sm flex items-center justify-center gap-2.5">
          {/* Venue Directions */}
          {(card.type === 'wedding' || card.type === 'birthday') && card.venueMapUrl && (
            <a
              href={card.venueMapUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-neutral-200 hover:border-[#D4AF37] transition-all"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Venue Map</span>
            </a>
          )}

          {/* Wedding / Birthday: In-AR RSVP Button */}
          {card.type !== 'business' && (
            <button
              onClick={() => setIsRSVPOpen(true)}
              className="flex-[1.4] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 text-xs font-bold tracking-wide shadow-lg gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4 fill-neutral-950" />
              <span>RSVP Attending</span>
            </button>
          )}

          {/* Business Card: One-tap vCard Download */}
          {card.type === 'business' && (
            <button
              onClick={handleDownloadContact}
              className="flex-[1.4] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 text-xs font-bold tracking-wide shadow-lg gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Contact2 className="w-4 h-4" />
              <span>Save Contact (.vcf)</span>
            </button>
          )}
        </div>
      </footer>

      {/* In-AR RSVP Modal */}
      {isRSVPOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#121215] border border-[#D4AF37]/50 p-6 text-white shadow-2xl gold-glow">
            <h3 className="font-serif-luxury text-xl font-bold text-[#D4AF37] text-center mb-1">
              Celebration RSVP
            </h3>
            <p className="text-xs text-neutral-400 text-center mb-5">
              Confirm your attendance for {card.title}
            </p>

            {rsvpSubmitted ? (
              <div className="text-center py-6 space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">RSVP Received!</h4>
                <p className="text-xs text-neutral-400">
                  Thank you, {guestName}. We can't wait to celebrate together!
                </p>
              </div>
            ) : (
              <form onSubmit={handleRSVPSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Christopher Nolan"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAttending(true)}
                    className={`flex-1 py-2 rounded-lg border font-bold transition-all ${
                      attending
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'border-neutral-800 text-neutral-500'
                    }`}
                  >
                    Joyfully Attend
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending(false)}
                    className={`flex-1 py-2 rounded-lg border font-bold transition-all ${
                      !attending
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'border-neutral-800 text-neutral-500'
                    }`}
                  >
                    Regretfully Decline
                  </button>
                </div>

                {attending && (
                  <>
                    <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plusOne}
                        onChange={(e) => setPlusOne(e.target.checked)}
                        className="rounded accent-[#D4AF37]"
                      />
                      <span>Bringing a +1 Guest</span>
                    </label>

                    <div>
                      <label className="block text-neutral-300 font-semibold mb-1">
                        Dietary Preferences / Allergies
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vegetarian, Gluten-free"
                        value={dietary}
                        onChange={(e) => setDietary(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRSVPOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-950 font-bold shadow gold-glow"
                  >
                    Send RSVP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
