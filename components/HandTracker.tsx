import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { Loader2, ScanLine, Hand, Grab, Minimize2, Users } from 'lucide-react';
import { HandGesture, InteractionState } from '../types';

interface HandTrackerProps {
  onPositionUpdate: (state: InteractionState) => void;
  onError: (msg: string) => void;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17] // Knuckles
];

const HandTracker: React.FC<HandTrackerProps> = ({ onPositionUpdate, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGesture, setCurrentGesture] = useState<HandGesture>(HandGesture.NONE);
  const [handCount, setHandCount] = useState(0);
  
  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let lastVideoTime = -1;

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2, // Enable dual hand tracking
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 320, 
                height: 240,
                frameRate: { ideal: 60 } // Try for smoother tracking
            } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            setIsLoading(false);
            predict();
          });
        }
      } catch (err: any) {
        console.error(err);
        setIsLoading(false);
        onError("Camera access denied or model failed to load.");
      }
    };

    const detectSingleHandGesture = (landmarks: NormalizedLandmark[]): { gesture: HandGesture, pinchDist: number } => {
        // Points
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];

        // 1. PINCH Detection
        const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const isPinch = pinchDist < 0.05;

        // 2. FIST Detection
        const curled = (tipIdx: number, pipIdx: number) => {
            const tipDist = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
            const pipDist = Math.hypot(landmarks[pipIdx].x - wrist.x, landmarks[pipIdx].y - wrist.y);
            return tipDist < pipDist; // Tip is closer to wrist than knuckle
        };

        const fingersFolded = [
            curled(8, 6),   // Index
            curled(12, 10), // Middle
            curled(16, 14), // Ring
            curled(20, 18)  // Pinky
        ].filter(Boolean).length;

        if (fingersFolded >= 3) {
            return { gesture: HandGesture.FIST, pinchDist };
        }
        if (isPinch) {
            return { gesture: HandGesture.PINCH, pinchDist };
        }

        return { gesture: HandGesture.OPEN, pinchDist };
    };

    const drawHand = (landmarks: NormalizedLandmark[], ctx: CanvasRenderingContext2D, width: number, height: number, color: string) => {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Draw Connections (Bones)
      ctx.globalAlpha = 0.7;
      for (const [start, end] of HAND_CONNECTIONS) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Draw Landmarks (Joints)
      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        const x = p.x * width;
        const y = p.y * height;
        ctx.beginPath();
        // Highlight tips
        if ([4,8,12,16,20].includes(i)) {
             ctx.fillStyle = '#ffffff'; 
             ctx.arc(x, y, 3, 0, 2 * Math.PI);
        } else {
             ctx.fillStyle = color;
             ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        }
        ctx.fill();
      }
    };

    const predict = () => {
      if (videoRef.current && canvasRef.current && handLandmarker) {
        let startTimeMs = performance.now();
        
        if (canvasRef.current.width !== videoRef.current.videoWidth) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }

        if (videoRef.current.currentTime !== lastVideoTime) {
          lastVideoTime = videoRef.current.currentTime;
          const result = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
          
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            const hands = result.landmarks;
            setHandCount(hands.length);

            if (hands.length > 0) {
              // --- Logic for 1 or 2 hands ---
              
              // Hand 1
              const h1 = hands[0];
              const g1 = detectSingleHandGesture(h1);
              const p1 = h1[9]; // Palm center
              
              // Defaults
              let finalX = p1.x;
              let finalY = p1.y;
              let finalGesture = g1.gesture;
              let finalPinch = g1.pinchDist;
              let separation = 0;

              // Draw Hand 1
              drawHand(h1, ctx, canvasRef.current.width, canvasRef.current.height, '#00ffff');

              // Hand 2 (if exists)
              if (hands.length > 1) {
                  const h2 = hands[1];
                  const g2 = detectSingleHandGesture(h2);
                  const p2 = h2[9];

                  // Calculate Midpoint
                  finalX = (p1.x + p2.x) / 2;
                  finalY = (p1.y + p2.y) / 2;

                  // Calculate Separation
                  separation = Math.hypot(p1.x - p2.x, p1.y - p2.y);

                  // Combine Gestures
                  if (g1.gesture === HandGesture.FIST && g2.gesture === HandGesture.FIST) {
                      finalGesture = HandGesture.DUAL_FIST;
                  } else {
                      finalGesture = HandGesture.DUAL_OPEN;
                  }
                  
                  // Draw Hand 2
                  drawHand(h2, ctx, canvasRef.current.width, canvasRef.current.height, '#ff00ff');

                  // Draw Connection Line
                  ctx.beginPath();
                  ctx.strokeStyle = '#ffffff';
                  ctx.setLineDash([5, 5]);
                  ctx.moveTo(p1.x * canvasRef.current.width, p1.y * canvasRef.current.height);
                  ctx.lineTo(p2.x * canvasRef.current.width, p2.y * canvasRef.current.height);
                  ctx.stroke();
                  ctx.setLineDash([]);
                  
                  // Draw Center Point
                  ctx.beginPath();
                  ctx.fillStyle = '#ffff00';
                  ctx.arc(finalX * canvasRef.current.width, finalY * canvasRef.current.height, 5, 0, 2 * Math.PI);
                  ctx.fill();
              }

              setCurrentGesture(finalGesture);

              // Map to 3D World (0..1 -> -12..12)
              // Flip X because it's a mirror view
              const worldX = (1.0 - finalX - 0.5) * 24; 
              const worldY = -(finalY - 0.5) * 20;
              const worldZ = 0;

              onPositionUpdate({
                  position: new THREE.Vector3(worldX, worldY, worldZ),
                  gesture: finalGesture,
                  pinchDelta: finalPinch,
                  handCount: hands.length,
                  separation: separation
              });

            } else {
               setCurrentGesture(HandGesture.NONE);
            }
          }
        }
        animationFrameId = requestAnimationFrame(predict);
      }
    };

    setup();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (handLandmarker) {
        handLandmarker.close();
      }
    };
  }, [onPositionUpdate, onError]);

  const getGestureIcon = () => {
      if (currentGesture === HandGesture.DUAL_FIST) return <Users size={16} className="text-red-500" />;
      if (currentGesture === HandGesture.DUAL_OPEN) return <Users size={16} className="text-purple-400" />;
      switch(currentGesture) {
          case HandGesture.FIST: return <Grab size={16} className="text-red-400" />;
          case HandGesture.PINCH: return <Minimize2 size={16} className="text-yellow-400" />;
          case HandGesture.OPEN: return <Hand size={16} className="text-cyan-400" />;
          default: return <ScanLine size={16} className="text-gray-500" />;
      }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 w-72 h-56 bg-black/80 rounded-2xl border border-white/20 overflow-hidden shadow-2xl backdrop-blur-md transition-all group hover:border-white/40">
       
       {/* Loader */}
       {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400 gap-2 z-20 bg-black/90">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-mono">INITIALIZING SENSORS...</span>
        </div>
       )}
       
       <div className="relative w-full h-full">
         <video 
           ref={videoRef}
           autoPlay 
           playsInline
           muted
           className={`w-full h-full object-cover transform -scale-x-100 ${isLoading ? 'opacity-0' : 'opacity-60'}`}
         />
         <canvas 
           ref={canvasRef}
           className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
         />
       </div>
       
       {/* Status Badges */}
       <div className="absolute top-2 left-2 flex gap-1 z-10">
          <div className="bg-red-500/20 border border-red-500/50 px-2 py-0.5 rounded text-[9px] text-red-200 font-mono flex items-center gap-1 backdrop-blur-sm animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            LIVE
          </div>
          {handCount > 0 && (
            <div className="bg-blue-500/20 border border-blue-500/50 px-2 py-0.5 rounded text-[9px] text-blue-200 font-mono flex items-center gap-1 backdrop-blur-sm">
                HANDS: {handCount}
            </div>
          )}
       </div>

       {/* Gesture Indicator */}
       <div className="absolute top-2 right-2 z-10">
           <div className="bg-black/60 border border-white/10 px-2 py-1 rounded text-xs text-white font-mono flex items-center gap-2 backdrop-blur-sm">
               {getGestureIcon()}
               <span>{currentGesture === HandGesture.NONE ? 'SEARCHING' : currentGesture.replace('_', ' ')}</span>
           </div>
       </div>

       <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end">
          <div className="text-[10px] text-gray-400 font-mono">
            <span className="text-white">VISUAL_CORE</span> :: {handCount === 2 ? 'DUAL_LINK_ACTIVE' : 'SINGLE_THREAD'}
          </div>
       </div>
       
       {/* Decorative Grid */}
       <div className="absolute inset-0 border border-white/10 pointer-events-none rounded-2xl"></div>
    </div>
  );
};

export default HandTracker;