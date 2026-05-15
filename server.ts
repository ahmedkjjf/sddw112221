import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    const { code, type, promptType } = req.body;
    
    try {
      let prompt = "";
      if (promptType === 'reconstruct') {
        prompt = `[TASK: FULL_SOURCE_RECONSTRUCTION] TYPE: ${type}\nOBJECTIVE: 1. RECONSTRUCT FULL LOGIC. 2. ORGANIZE BEAUTIFULLY. 3. RESTORE FLOW.\nINPUT:\n${code}`;
      } else if (promptType === 'normalize') {
        prompt = `[TASK: HUMAN_VARIABLES] 1. RENAME GENERIC VARS. 2. DO NOT CHANGE LOGIC. 3. OUTPUT ONLY CODE BLOCK.\nINPUT:\n${code}`;
      } else if (promptType === 'vulnerabilities') {
        prompt = `[TASK: SECURITY_VULNERABILITY_SCAN] ANALYZE FOR FLAWS, BACKDOORS. PROVIDE RISK LEVELS. OUTPUT IN ARABIC MARKDOWN.\nINPUT CODE:\n${code}`;
      }

      res.setHeader('Content-Type', 'text/plain');
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      for await (const chunk of response) {
        const text = chunk.text;
        res.write(text);
      }
      res.end();
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).send(error.message);
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
