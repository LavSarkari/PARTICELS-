
# Nebula Flow - AI Particle System

**Nebula Flow** is a real-time, interactive 3D particle simulation powered by **React**, **Three.js**, and **Google Gemini AI**. 

It features a dual-mode interaction system allowing users to control the nebula using standard mouse inputs or **vision-based hand tracking** via the webcam.

![Project Banner](https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop)

## 🚀 Features

- **Generative AI Config**: Describe an effect (e.g., "Matrix Rain", "Golden Fireflies") and Gemini 2.5 Flash generates the physics parameters instantly.
- **Hand Tracking Control**: Control the particle field with your hands using MediaPipe.
  - **✊ Fist**: Creates a gravity well (Black Hole attraction).
  - **🖐 Open Hand**: Creates a repulsion force field.
  - **🤏 Pinch**: Fine-tune particle density.
  - **👐 Two Hands**: Spread hands apart to expand the nebula (Zoom/Dispersion control).
- **Advanced Physics**: Custom GLSL shaders for performant handling of 10,000+ particles with noise displacement and color mixing.
- **Dynamic Visualization**: Particles change brightness based on velocity and energy.

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **3D Engine**: Three.js + React Three Fiber (@react-three/fiber)
- **AI Model**: Google Gemini 2.5 Flash (@google/genai)
- **Computer Vision**: MediaPipe Hand Landmarker
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nebula-flow.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Google Cloud API Key (requires Gemini API access):
   ```
   VITE_API_KEY=your_google_ai_studio_api_key
   ```
   *Note: The app checks `process.env.API_KEY` or allows demo mode.*

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🎮 Controls

### Mouse Mode
- **Move**: Influence particle flow.
- **Left Click + Drag**: Rotate camera.
- **Scroll**: Zoom in/out.

### Hand Tracking Mode
1. Click "Hand Tracking" in the Settings panel.
2. Allow camera access.
3. **One Hand**:
   - **Open Palm**: Repel particles.
   - **Fist**: Attract particles.
4. **Two Hands**:
   - **Distance**: Move hands apart to expand the universe, bring them closer to compress it.
   - **Dual Fist**: Triggers a high-intensity gravitational collapse.

## 📄 License

MIT License.
