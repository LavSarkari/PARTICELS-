import { ParticleConfig, Preset } from './types';

export const DEFAULT_CONFIG: ParticleConfig = {
  count: 8000,
  size: 0.8,
  speed: 0.5,
  noiseStrength: 1.2,
  colorStart: '#00ffff',
  colorEnd: '#ff00ff',
  dispersion: 5.0,
  shapeBias: 0.2,
};

export const PRESETS: Preset[] = [
  {
    name: "Cosmic Nebula",
    config: DEFAULT_CONFIG
  },
  {
    name: "Golden Fireflies",
    config: {
      count: 5000,
      size: 1.5,
      speed: 0.2,
      noiseStrength: 2.0,
      colorStart: '#ffd700',
      colorEnd: '#ff4500',
      dispersion: 8.0,
      shapeBias: 0.5,
    }
  },
  {
    name: "Matrix Rain",
    config: {
      count: 12000,
      size: 0.6,
      speed: 1.5,
      noiseStrength: 0.5,
      colorStart: '#00ff00',
      colorEnd: '#003300',
      dispersion: 10.0,
      shapeBias: 1.0,
    }
  },
  {
    name: "Ice Storm",
    config: {
      count: 15000,
      size: 0.5,
      speed: 2.5,
      noiseStrength: 3.0,
      colorStart: '#ffffff',
      colorEnd: '#aaddff',
      dispersion: 6.0,
      shapeBias: 0.8,
    }
  }
];
