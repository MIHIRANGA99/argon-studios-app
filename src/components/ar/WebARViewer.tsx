import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { MindARThree } from '../../vendor/mindar/mindar-image-three.prod.js';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Navigation,
  Send,
  Contact2,
  Camera,
  Sparkles,
  CheckCircle2,
  Maximize2,
  Scan
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
  // Mode & Tracking states
  const [viewMode, setViewMode] = useState<'camera' | 'studio'>('camera');
  const [trackingMode, setTrackingMode] = useState<'optical' | 'spatial'>('optical');
  const [isTargetLocked, setIsTargetLocked] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Audio & Interaction states
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
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const augmentedVideoRef = useRef<HTMLVideoElement>(null);

  // MindAR & Three.js instances ref
  const mindarRef = useRef<any>(null);
  const studioThreeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cardGroup: THREE.Group;
    animationFrameId: number;
  } | null>(null);

  // Card meshes reference for mode transitions
  const cardGroupRef = useRef<THREE.Group | null>(null);
  const anchorGroupRef = useRef<THREE.Group | null>(null);
  const activeSceneRef = useRef<THREE.Scene | null>(null);

  // Rotation target for gyro/touch
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Record initial scan
  useEffect(() => {
    StorageService.recordScan(card.id);
  }, [card.id]);

  // Determine effective target .mind file URL
  const targetMindSrc = card.targetMindUrl || (
    card.type === 'wedding'
      ? '/targets/wedding.mind'
      : card.type === 'business'
      ? '/targets/business.mind'
      : '/targets/birthday.mind'
  );

  // Helper: Build the 3D card group (Video Plane + Champagne Gold Metallic Frame + Glow)
  const createCardMeshGroup = (width: number, height: number) => {
    const group = new THREE.Group();

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
      new THREE.PlaneGeometry(width, height),
      planeMaterial
    );
    group.add(cardPlane);

    // 2) Champagne Gold Chamfered Metallic Frame
    const frameGeometry = new THREE.PlaneGeometry(width + 0.08, height + 0.08);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.15,
      side: THREE.DoubleSide
    });
    const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    frameMesh.position.z = -0.005;
    group.add(frameMesh);

    // 3) Outer Thin Gold Glowing Border Line
    const edges = new THREE.EdgesGeometry(frameGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffd700,
      linewidth: 2
    });
    const borderLines = new THREE.LineSegments(edges, lineMaterial);
    borderLines.position.z = 0.005;
    group.add(borderLines);

    return group;
  };

  // Helper: Create 3D Particle System
  const createParticlesMesh = () => {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const isRose = card.effect === 'rose_petals';
    const primaryColor = isRose ? new THREE.Color(0xe11d48) : new THREE.Color(0xd4af37);
    const secondaryColor = isRose ? new THREE.Color(0xfb7185) : new THREE.Color(0xfff5c0);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 4;
      positions[i3 + 1] = (Math.random() - 0.5) * 4;
      positions[i3 + 2] = (Math.random() - 0.5) * 2;

      const c = Math.random() > 0.5 ? primaryColor : secondaryColor;
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geometry, material);
  };

  // 1. Initialize MindAR Optical Image Tracking Engine
  const startMindAR = useCallback(async () => {
    if (!containerRef.current) return;
    setCameraError(null);

    try {
      // Clean up previous instance if any
      if (mindarRef.current) {
        mindarRef.current.stop();
        mindarRef.current = null;
      }

      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: targetMindSrc,
        filterMinCF: 0.0001,
        filterBeta: 0.001,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no'
      });

      mindarRef.current = mindarThree;
      const { renderer, scene, camera } = mindarThree;
      activeSceneRef.current = scene;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);
      const goldDirLight = new THREE.DirectionalLight(0xd4af37, 2.5);
      goldDirLight.position.set(3, 5, 4);
      scene.add(goldDirLight);

      // In MindAR, normalized image target width is 1.0; height is 4/3 (~1.333) for standard 3:4 portrait
      const cardWidth = 1.0;
      const cardHeight = 1.333;
      const cardGroup = createCardMeshGroup(cardWidth, cardHeight);
      cardGroupRef.current = cardGroup;

      const particlesMesh = createParticlesMesh();
      cardGroup.add(particlesMesh);

      // Add Anchor 0
      const anchor = mindarThree.addAnchor(0);
      anchorGroupRef.current = anchor.group;
      anchor.group.add(cardGroup);

      // Optical Target Event Listeners
      anchor.onTargetFound = () => {
        setIsTargetLocked(true);
        if (augmentedVideoRef.current) {
          augmentedVideoRef.current.play().catch(() => {});
        }
        triggerConfetti(card.effect);
      };

      anchor.onTargetLost = () => {
        setIsTargetLocked(false);
      };

      await mindarThree.start();

      // Render Loop
      let clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const elapsedTime = clock.getElapsedTime();

        // If in Detached Spatial Mode, smoothly apply gyro / touch orientation
        if (trackingMode === 'spatial' && cardGroup) {
          cardGroup.rotation.x += (targetRotation.current.x - cardGroup.rotation.x) * 0.1;
          cardGroup.rotation.y += (targetRotation.current.y - cardGroup.rotation.y) * 0.1;
          cardGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.04;
        }

        if (particlesMesh) {
          particlesMesh.rotation.y = elapsedTime * 0.1;
        }

        renderer.render(scene, camera);
      });
    } catch (err: any) {
      console.warn('MindAR Optical Tracking initialization failed:', err);
      setCameraError('Optical camera tracking unavailable. Switching to Studio 3D stage.');
      setViewMode('studio');
    }
  }, [card, targetMindSrc, trackingMode]);

  // 2. Initialize Fallback Studio Mode (Three.js only, no camera required)
  const startStudioStage = useCallback(() => {
    if (!fallbackCanvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({
      canvas: fallbackCanvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const goldDirLight = new THREE.DirectionalLight(0xd4af37, 2.5);
    goldDirLight.position.set(3, 5, 4);
    scene.add(goldDirLight);

    const cardGroup = createCardMeshGroup(2.0, 2.67);
    scene.add(cardGroup);

    const particlesMesh = createParticlesMesh();
    scene.add(particlesMesh);

    setIsTargetLocked(true);
    if (augmentedVideoRef.current) {
      augmentedVideoRef.current.play().catch(() => {});
    }

    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      cardGroup.rotation.x += (targetRotation.current.x - cardGroup.rotation.x) * 0.1;
      cardGroup.rotation.y += (targetRotation.current.y - cardGroup.rotation.y) * 0.1;
      cardGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.05;

      if (particlesMesh) {
        particlesMesh.rotation.y = elapsedTime * 0.08;
      }

      renderer.render(scene, camera);
      studioThreeRef.current!.animationFrameId = requestAnimationFrame(animate);
    };

    studioThreeRef.current = {
      scene,
      camera,
      renderer,
      cardGroup,
      animationFrameId: requestAnimationFrame(animate)
    };
  }, [card]);

  // Master viewMode effect (Camera MindAR vs Studio)
  useEffect(() => {
    if (viewMode === 'camera') {
      if (studioThreeRef.current) {
        cancelAnimationFrame(studioThreeRef.current.animationFrameId);
        studioThreeRef.current.renderer.dispose();
        studioThreeRef.current = null;
      }
      startMindAR();
    } else {
      if (mindarRef.current) {
        mindarRef.current.stop();
        mindarRef.current = null;
      }
      startStudioStage();
    }

    return () => {
      if (mindarRef.current) {
        mindarRef.current.stop();
        mindarRef.current = null;
      }
      if (studioThreeRef.current) {
        cancelAnimationFrame(studioThreeRef.current.animationFrameId);
        studioThreeRef.current.renderer.dispose();
        studioThreeRef.current = null;
      }
    };
  }, [viewMode, startMindAR, startStudioStage]);

  // 3. Handle Detaching / Locking Mode Switch ("Pop Out to 3D" vs "Anchor to Paper")
  const handleToggleTrackingMode = () => {
    const nextMode = trackingMode === 'optical' ? 'spatial' : 'optical';
    setTrackingMode(nextMode);

    if (!cardGroupRef.current || !anchorGroupRef.current || !activeSceneRef.current) return;

    if (nextMode === 'spatial') {
      // Detach from MindAR physical anchor and attach to scene in front of camera
      anchorGroupRef.current.remove(cardGroupRef.current);
      activeSceneRef.current.add(cardGroupRef.current);
      cardGroupRef.current.position.set(0, 0, -2.5);
      cardGroupRef.current.rotation.set(0, 0, 0);
      cardGroupRef.current.scale.set(1.4, 1.4, 1.4);
      setIsTargetLocked(true);
    } else {
      // Re-attach to physical MindAR anchor
      activeSceneRef.current.remove(cardGroupRef.current);
      anchorGroupRef.current.add(cardGroupRef.current);
      cardGroupRef.current.position.set(0, 0, 0);
      cardGroupRef.current.rotation.set(0, 0, 0);
      cardGroupRef.current.scale.set(1, 1, 1);
      targetRotation.current = { x: 0, y: 0 };
    }
  };

  // 4. Mobile Gyroscope Listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (trackingMode === 'spatial' || viewMode === 'studio') {
        if (e.gamma !== null && e.beta !== null) {
          const radX = ((e.beta - 45) * Math.PI) / 180;
          const radY = (e.gamma * Math.PI) / 180;
          targetRotation.current.x = THREE.MathUtils.clamp(radX * 0.4, -0.4, 0.4);
          targetRotation.current.y = THREE.MathUtils.clamp(radY * 0.4, -0.5, 0.5);
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [trackingMode, viewMode]);

  // 5. Pointer Drag for Touch or Desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    if (trackingMode === 'spatial' || viewMode === 'studio') {
      isDragging.current = true;
      previousPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousPointer.current.x;
    const deltaY = e.clientY - previousPointer.current.y;

    targetRotation.current.y += deltaX * 0.006;
    targetRotation.current.x += deltaY * 0.006;

    targetRotation.current.x = THREE.MathUtils.clamp(targetRotation.current.x, -0.5, 0.5);
    targetRotation.current.y = THREE.MathUtils.clamp(targetRotation.current.y, -0.6, 0.6);

    previousPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Confetti helper
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
        colors: ['#D4AF37', '#F3E5AB', '#FFFFFF', '#AA771C']
      });
    }
  };

  // Audio gesture unlock (Mobile Safari / Chrome autoplay requirement)
  const handleUnlockAudio = () => {
    setHasInteracted(true);
    setIsMuted(false);
    if (augmentedVideoRef.current) {
      augmentedVideoRef.current.muted = false;
      augmentedVideoRef.current.play().catch(() => {});
    }
  };

  // Handle RSVP Submit
  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    await StorageService.recordRSVP({
      id: 'rsvp-' + Date.now(),
      cardId: card.id,
      guestName: guestName.trim(),
      attending,
      plusOne,
      dietary: dietary.trim(),
      submittedAt: new Date().toISOString()
    });

    setRsvpSubmitted(true);
    triggerConfetti('golden_sparkles');
    setTimeout(() => {
      setIsRSVPOpen(false);
      setRsvpSubmitted(false);
    }, 2400);
  };

  // Handle vCard Download
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
      className="relative w-full h-screen overflow-hidden bg-black select-none touch-none"
    >
      {/* Hidden Augmented Video Texture Feed */}
      {card.videoUrl && (
        <video
          ref={augmentedVideoRef}
          src={card.videoUrl}
          playsInline
          loop
          muted={isMuted}
          crossOrigin="anonymous"
          className="hidden"
        />
      )}

      {/* Fallback Canvas for Studio Mode */}
      {viewMode === 'studio' && (
        <div className="absolute inset-0 bg-radial from-neutral-900 via-[#0A0A0C] to-black">
          <canvas ref={fallbackCanvasRef} className="w-full h-full block" />
        </div>
      )}

      {/* Optical Viewfinder HUD (Visible in Optical Camera Mode) */}
      {viewMode === 'camera' && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center p-6">
          <div
            className={`relative w-64 h-80 sm:w-72 sm:h-96 rounded-2xl border-2 transition-all duration-300 ${
              isTargetLocked
                ? 'border-emerald-400/80 shadow-[0_0_40px_rgba(52,211,153,0.3)]'
                : 'border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] animate-pulse'
            }`}
          >
            {/* Corner Alignment Brackets */}
            <span className="absolute -top-2 -left-2 w-5 h-5 border-t-3 border-l-3 border-[#D4AF37]"></span>
            <span className="absolute -top-2 -right-2 w-5 h-5 border-t-3 border-r-3 border-[#D4AF37]"></span>
            <span className="absolute -bottom-2 -left-2 w-5 h-5 border-b-3 border-l-3 border-[#D4AF37]"></span>
            <span className="absolute -bottom-2 -right-2 w-5 h-5 border-b-3 border-r-3 border-[#D4AF37]"></span>

            {/* Target Status Tag */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#D4AF37]/60 text-[10px] font-bold tracking-widest text-[#D4AF37] flex items-center gap-1.5 shadow-xl whitespace-nowrap">
              <span
                className={`w-2 h-2 rounded-full ${
                  isTargetLocked ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                }`}
              ></span>
              <span>
                {trackingMode === 'spatial'
                  ? '3D DETACHED MODE • GYROSCOPE'
                  : isTargetLocked
                  ? 'OPTICAL TARGET LOCKED'
                  : 'AIM AT PRINTED CARD ARTWORK'}
              </span>
            </div>

            {/* Hint */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-neutral-300 font-medium bg-black/70 px-3.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              {trackingMode === 'spatial'
                ? 'Drag or tilt phone to rotate card in 3D'
                : 'Point camera at printed photo to bring it to life'}
            </div>
          </div>
        </div>
      )}

      {/* Floating Top Navigation HUD */}
      <header className="relative z-30 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/60 to-transparent backdrop-blur-[2px]">
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
            <span>ARGON Spatial Studio</span>
          </span>
          <h2 className="font-serif-luxury text-base font-bold text-white tracking-wide truncate max-w-[200px]">
            {card.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Hybrid Mode: "Pop Out to 3D" / "Anchor to Print" */}
          {viewMode === 'camera' && (
            <button
              onClick={handleToggleTrackingMode}
              title={trackingMode === 'optical' ? 'Pop out card into 3D' : 'Re-lock card to paper print'}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                trackingMode === 'spatial'
                  ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37] shadow-lg gold-glow'
                  : 'bg-black/60 border-white/20 text-neutral-200 hover:border-[#D4AF37]'
              }`}
            >
              {trackingMode === 'optical' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pop Out</span>
                </>
              ) : (
                <>
                  <Scan className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anchor to Card</span>
                </>
              )}
            </button>
          )}

          {/* View Mode Toggle (Camera vs Studio) */}
          <button
            onClick={() => setViewMode(viewMode === 'camera' ? 'studio' : 'camera')}
            title={viewMode === 'camera' ? 'Switch to Studio Mode' : 'Switch to Live Camera'}
            className={`p-2 rounded-full border backdrop-blur-md transition-all ${
              viewMode === 'camera'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-black/60 border-white/20 text-neutral-300'
            }`}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (augmentedVideoRef.current) {
                augmentedVideoRef.current.muted = nextMuted;
              }
            }}
            className="p-2 rounded-full bg-black/60 border border-white/20 text-neutral-300 hover:text-white transition-all"
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

      {/* Floating Bottom Action Controls */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 pb-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center gap-3 pointer-events-auto">
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
              onClick={() => {
                // If in optical mode, automatically pop out to 3D so typing RSVP is comfortable
                if (trackingMode === 'optical') {
                  handleToggleTrackingMode();
                }
                setIsRSVPOpen(true);
              }}
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
              Confirm attendance for {card.title}
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
