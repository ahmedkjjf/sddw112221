export async function analyzeCodeStream(code: string, type: string, onChunk: (text: string) => void) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, type, promptType: 'reconstruct' })
    });

    if (!response.ok) throw new Error(await response.text());

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    let fullText = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function normalizeVariablesStream(code: string, onChunk: (text: string) => void) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, promptType: 'normalize' })
    });

    if (!response.ok) throw new Error(await response.text());

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    let fullText = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Variable Normalization Error:", error);
    throw error;
  }
}

export async function scanVulnerabilitiesStream(code: string, onChunk: (text: string) => void) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, promptType: 'vulnerabilities' })
    });

    if (!response.ok) throw new Error(await response.text());

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    let fullText = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Vulnerability Scan Error:", error);
    throw error;
  }
}
