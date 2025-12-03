import * as THREE from 'three';

export interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  noiseStrength: number;
  colorStart: string;
  colorEnd: string;
  dispersion: number;
  shapeBias: number; // 0 for spherical, 1 for chaotic/box
}

export interface Preset {
  name: string;
  config: ParticleConfig;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
}

export enum InputMode {
  MOUSE = 'MOUSE',
  CAMERA = 'CAMERA',
}

export enum HandGesture {
  OPEN = 'OPEN',
  FIST = 'FIST',
  PINCH = 'PINCH',
  NONE = 'NONE',
  // Combined gestures
  DUAL_FIST = 'DUAL_FIST',
  DUAL_OPEN = 'DUAL_OPEN'
}

export interface InteractionState {
  position: THREE.Vector3;
  gesture: HandGesture;
  pinchDelta: number; // 0 to 1, representing pinch strength or distance
  handCount: number;
  separation: number; // Distance between two hands (0 to 1)
}