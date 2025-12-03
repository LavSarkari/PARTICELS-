import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import ParticleField from './components/ParticleField';
import Controls from './components/Controls';
import HandTracker from './components/HandTracker';
import { generateParticleConfig } from './services/geminiService';
import { DEFAULT_CONFIG } from './constants';
import { ParticleConfig, AppState, InputMode, InteractionState, HandGesture } from './types';

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>(DEFAULT_CONFIG);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.MOUSE);
  
  // Shared reference for interaction state
  const interactionStateRef = useRef<InteractionState>({
      position: new THREE.Vector3(0, 0, 0),
      gesture: HandGesture.OPEN,
      pinchDelta: 0,
      handCount: 0,
      separation: 0
  });

  const handleGenerate = async (prompt: string) => {
    setAppState(AppState.GENERATING);
    try {
      if (!process.env.API_KEY) {
         console.warn("No API Key found. Simulating for demo.");
         await new Promise(r => setTimeout(r, 1500));
         throw new Error("No API Key");
      }

      const newConfig = await generateParticleConfig(prompt);
      setConfig(newConfig);
      setAppState(AppState.IDLE);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  // Callback for HandTracker to update the ref
  const handleHandUpdate = (state: InteractionState) => {
    interactionStateRef.current = state;
  };

  const handleHandError = (msg: string) => {
      console.error("Hand Tracker Error:", msg);
      setInputMode(InputMode.MOUSE);
      alert("Could not start camera tracking: " + msg);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* UI Layer */}
      <Controls 
        config={config} 
        onConfigChange={setConfig} 
        onGenerate={handleGenerate}
        appState={appState}
        inputMode={inputMode}
        onToggleInputMode={setInputMode}
      />

      {/* Hand Tracking Layer (Only active when mode is CAMERA) */}
      {inputMode === InputMode.CAMERA && (
        <HandTracker 
            onPositionUpdate={handleHandUpdate} 
            onError={handleHandError}
        />
      )}

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050505']} />
        
        {/* Background stars for depth */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={null}>
            <ParticleField 
                config={config} 
                inputMode={inputMode}
                interactionStateRef={interactionStateRef}
            />
        </Suspense>

        <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            maxDistance={30} 
            minDistance={2}
            autoRotate={true}
            autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Interaction Hint */}
      <div className="absolute bottom-6 right-6 pointer-events-none text-white/30 text-sm select-none z-10 hidden md:block">
        <p>
            {inputMode === InputMode.MOUSE 
                ? 'Move mouse to interact • Drag to rotate' 
                : '🖐 1 Hand: Repel/Attract • 👐 2 Hands: Expand/Collapse'
            }
        </p>
      </div>

    </div>
  );
};

export default App;