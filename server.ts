import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post('/api/ai/insights', async (req, res) => {
    try {
      const { stats, marketplaceData } = req.body;
      
      const prompt = `
        You are the Smart Intelligence Agent for OneCore SDK Admin Panel.
        Analyze the following telemetry and provide a strategic update in concise, technical, and futuristic markdown for an admin and their resellers.
        
        Stats:
        - Total Licenses: ${stats.total}
        - Active Nodes: ${stats.active}
        - Total Build Cycles: ${stats.totalBuilds}
        
        Marketplace Context:
        ${JSON.stringify(marketplaceData)}
        
        Provide:
        1. A brief "Cluster Health" status (futuristic tone).
        2. One "Smart Recommendation" to optimize reseller revenue or node performance.
        3. A "Threat Level" assessment (Cyberpunk vibe).
        
        Keep it brief (max 150 words). Use markdown bolding and bullet points.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error('Gemini Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
