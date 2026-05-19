import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (err) {
    console.error('Firebase Admin init failed (Expected if no service account):', err);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'operational', timestamp: Date.now() });
  });

  // License Verification Endpoint for AAR/SDK
  app.post('/api/v1/license/verify', async (req, res) => {
    try {
      const { packageName, licenseKey } = req.body;

      if (!db) {
        return res.status(503).json({ error: 'Database service unavailable' });
      }

      // 1. Find License
      const licenseSnap = await db.collection('licenses').doc(licenseKey).get();
      
      if (!licenseSnap.exists) {
        return res.status(404).json({ success: false, message: 'Invalid License Vector' });
      }

      const licenseData = licenseSnap.data();

      // 2. Cross-verify Package
      // In a real scenario, you'd check if the package matches the license scope
      
      // 3. Check if License is Active
      if (licenseData?.status !== 'active') {
        return res.json({ success: false, message: `Node is ${licenseData?.status || 'Invalid'}` });
      }

      // 4. Update Pulse (Last Seen)
      await licenseSnap.ref.update({
        lastPulse: Date.now(),
        nodeStatus: 'online'
      });

      res.json({ 
        success: true, 
        message: 'AAR Integrity Validated',
        config: {
          stealthMode: true,
          antiDump: true,
          injectionFrequency: 5000
        }
      });
    } catch (error: any) {
      console.error('Core Verification Error:', error);
      res.status(500).json({ error: 'Deep Link Verification Failed' });
    }
  });

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

      // Simple retry logic for 503 or transient errors
      let result;
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
          });
          break;
        } catch (err: any) {
          lastError = err;
          // If it's a 503, wait and retry
          if (err.message?.includes('503') || err.status === 503 || err.message?.includes('high demand')) {
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000 * (3 - retries)));
              continue;
            }
          }
          throw err;
        }
      }

      res.json({ text: result?.text || "Telemetry analysis deferred due to high load. Core systems operational." });
    } catch (error: any) {
      console.error('Gemini Error:', error);
      // Fallback response for the UI
      res.json({ 
        text: "### [SYSTEM NOTICE]\nAI Insight Forge is currently under heavy load. **Static Security Protocols** are maintaining 100% integrity. Telemetry suggests standard operational parameters are within safe bounds.\n\n*Recalibrating AI Link... Please check back in a moment.*"
      });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
