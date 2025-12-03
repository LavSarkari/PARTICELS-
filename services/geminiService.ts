import { GoogleGenAI, Type } from "@google/genai";
import { ParticleConfig } from "../types";

const SYSTEM_INSTRUCTION = `
You are a specialized visual effects copilot. Your job is to translate natural language descriptions of visual effects into a specific JSON configuration for a 3D particle system.

The particle system has the following parameters:
- count: Integer (1000 to 20000). Higher means denser.
- size: Float (0.1 to 3.0). Particle size.
- speed: Float (0.0 to 5.0). Animation speed.
- noiseStrength: Float (0.0 to 5.0). Turbulence/Chaos factor.
- colorStart: Hex String. Inner/Primary color.
- colorEnd: Hex String. Outer/Secondary color.
- dispersion: Float (1.0 to 15.0). How spread out the particles are.
- shapeBias: Float (0.0 to 1.0). 0.0 tends towards spherical/ordered, 1.0 tends towards cubic/chaotic.

Interpret the user's poetic or technical description and output the JSON.
If the user asks for "fire", think about reds, oranges, high speed, upward motion (simulated by noise).
If "galaxy", think purples, blues, rotation, spiral (simulated by noise/dispersion).
`;

export const generateParticleConfig = async (prompt: string): Promise<ParticleConfig> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            count: { type: Type.INTEGER },
            size: { type: Type.NUMBER },
            speed: { type: Type.NUMBER },
            noiseStrength: { type: Type.NUMBER },
            colorStart: { type: Type.STRING },
            colorEnd: { type: Type.STRING },
            dispersion: { type: Type.NUMBER },
            shapeBias: { type: Type.NUMBER },
          },
          required: ["count", "size", "speed", "noiseStrength", "colorStart", "colorEnd", "dispersion", "shapeBias"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ParticleConfig;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
