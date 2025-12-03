import React, { useState } from 'react';
import { Settings, Sparkles, Wand2, X, AlertCircle, MousePointer2, Camera } from 'lucide-react';
import { ParticleConfig, AppState, Preset, InputMode } from '../types';
import { PRESETS } from '../constants';

interface ControlsProps {
  config: ParticleConfig;
  onConfigChange: (newConfig: ParticleConfig) => void;
  onGenerate: (prompt: string) => Promise<void>;
  appState: AppState;
  inputMode: InputMode;
  onToggleInputMode: (mode: InputMode) => void;
}

const Controls: React.FC<ControlsProps> = ({ config, onConfigChange, onGenerate, appState, inputMode, onToggleInputMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'tweak' | 'ai'>('ai');

  const handleSliderChange = (key: keyof ParticleConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleColorChange = (key: keyof ParticleConfig, value: string) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handlePresetSelect = (preset: Preset) => {
      onConfigChange(preset.config);
  };

  const submitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await onGenerate(prompt);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-white/10 transition-all border border-white/10 shadow-lg"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-80 md:w-96 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={20}/>
            <h2 className="font-bold text-lg tracking-wide">Nebula Flow</h2>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 p-3 text-sm font-medium transition-colors flex justify-center items-center gap-2 ${activeTab === 'ai' ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500' : 'text-gray-400 hover:bg-white/5'}`}
        >
            <Wand2 size={16}/> AI Generator
        </button>
        <button 
            onClick={() => setActiveTab('tweak')}
            className={`flex-1 p-3 text-sm font-medium transition-colors flex justify-center items-center gap-2 ${activeTab === 'tweak' ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500' : 'text-gray-400 hover:bg-white/5'}`}
        >
            <Settings size={16}/> Manual Control
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        
        {/* Input Mode Toggle */}
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
             <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Interaction Mode</label>
             <div className="flex gap-2">
                <button 
                    onClick={() => onToggleInputMode(InputMode.MOUSE)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${inputMode === InputMode.MOUSE ? 'bg-white text-black' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
                >
                    <MousePointer2 size={14} /> Mouse
                </button>
                <button 
                    onClick={() => onToggleInputMode(InputMode.CAMERA)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${inputMode === InputMode.CAMERA ? 'bg-white text-black' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
                >
                    <Camera size={14} /> Hand Tracking
                </button>
             </div>
        </div>

        {activeTab === 'ai' && (
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Describe an effect</label>
                    <form onSubmit={submitPrompt} className="relative">
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. 'A violent red explosion', 'Calm blue ocean waves', 'Matrix code rain'"
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[100px] resize-none placeholder-gray-600 transition-colors"
                        />
                        <button 
                            type="submit"
                            disabled={appState === AppState.GENERATING || !prompt.trim()}
                            className="absolute bottom-3 right-3 p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all shadow-lg hover:shadow-purple-500/25"
                        >
                            {appState === AppState.GENERATING ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Wand2 size={18} />
                            )}
                        </button>
                    </form>
                    {appState === AppState.ERROR && (
                        <div className="mt-3 flex items-start gap-2 text-red-400 text-xs bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                            <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                            <span>Failed to generate. Please check your API key or try again.</span>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {PRESETS.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => handlePresetSelect(preset)}
                                className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-300 transition-all hover:border-white/20"
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'tweak' && (
            <div className="space-y-5">
                {/* Count */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Particle Count</span>
                        <span className="font-mono text-gray-200">{config.count}</span>
                    </div>
                    <input 
                        type="range" min="1000" max="20000" step="1000"
                        value={config.count}
                        onChange={(e) => handleSliderChange('count', Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Speed & Noise */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Speed</span>
                            <span className="font-mono text-gray-200">{config.speed.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="0" max="5" step="0.1"
                            value={config.speed}
                            onChange={(e) => handleSliderChange('speed', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Noise</span>
                            <span className="font-mono text-gray-200">{config.noiseStrength.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="0" max="5" step="0.1"
                            value={config.noiseStrength}
                            onChange={(e) => handleSliderChange('noiseStrength', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                {/* Dispersion & Size */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Spread</span>
                            <span className="font-mono text-gray-200">{config.dispersion.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="1" max="15" step="0.5"
                            value={config.dispersion}
                            onChange={(e) => handleSliderChange('dispersion', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Size</span>
                            <span className="font-mono text-gray-200">{config.size.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="3" step="0.1"
                            value={config.size}
                            onChange={(e) => handleSliderChange('size', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                {/* Shape Bias */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Shape (Sphere - Chaos)</span>
                        <span className="font-mono text-gray-200">{config.shapeBias.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" min="0" max="1" step="0.01"
                        value={config.shapeBias}
                        onChange={(e) => handleSliderChange('shapeBias', Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400">Core Color</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={config.colorStart}
                                onChange={(e) => handleColorChange('colorStart', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-xs font-mono text-gray-500 uppercase">{config.colorStart}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400">Outer Color</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={config.colorEnd}
                                onChange={(e) => handleColorChange('colorEnd', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-xs font-mono text-gray-500 uppercase">{config.colorEnd}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-black/40 text-center">
        <p className="text-[10px] text-gray-500">
          Powered by Gemini 2.5 Flash & Three.js
        </p>
      </div>
    </div>
  );
};

export default Controls;