import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Impromptu topic generator
app.post("/api/generate-impromptu", async (req, res) => {
  try {
    const { category = "college-life" } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // High-quality fallback topics for first-year students
      const fallbacks: Record<string, Array<any>> = {
        "college-life": [
          {
            topic: "Why 8:00 AM classes should be abolished by university decree",
            context: "Freshman seminar debate where you propose a humane campus schedule.",
            guidingQuestions: [
              "What happens to student alertness and sleep hygiene?",
              "How does schedule design affect GPA and mental health?",
              "What practical alternatives could the university adopt?",
            ],
            suggestedStructure: "Hook (The sound of the 7:15 AM alarm) -> 2 Main Points (Cognitive science & transit reality) -> Humorous call to action",
            timeLimitSeconds: 90,
          },
          {
            topic: "Dining Hall Etiquette: The Unwritten Rules of the Tray Return",
            context: "A lighthearted address to new dorm residents at your first floor meeting.",
            guidingQuestions: [
              "What is the ultimate faux pas during rush hour in the cafeteria?",
              "How can small communal habits foster better dorm camaraderie?",
              "What is your golden rule for sharing tables with strangers?",
            ],
            suggestedStructure: "Observational opening -> The 3 cardinal rules -> Warm closing on community spirit",
            timeLimitSeconds: 75,
          },
        ],
        "academic-debate": [
          {
            topic: "Should AI tools like Gemini and ChatGPT be mandatory in introductory college research?",
            context: "COMM 101 debate against traditional essay memorization.",
            guidingQuestions: [
              "Is AI a calculator for thought or an obstacle to critical reading?",
              "How should professors evaluate genuine analytical synthesis?",
              "Where do you draw the line between ethical collaboration and academic dishonesty?",
            ],
            suggestedStructure: "Provocative thesis -> The efficiency vs depth paradox -> Proposed research syllabus model",
            timeLimitSeconds: 120,
          },
        ],
        "fun-quirky": [
          {
            topic: "Pitching an absurd college club that somehow deserves full student council funding",
            context: "Annual student government budget allocation lightning pitch.",
            guidingQuestions: [
              "What bizarre campus need does this club address?",
              "How does it build unforgettable college memories?",
              "Why should $500 of campus funds go to your mascot or snacks?",
            ],
            suggestedStructure: "Dramatic hook -> The mission statement -> Budget breakdown -> Memorable vote request",
            timeLimitSeconds: 90,
          },
        ],
      };

      const pool = fallbacks[category] || fallbacks["college-life"];
      const selected = pool[Math.floor(Math.random() * pool.length)];
      return res.json(selected);
    }

    const prompt = `Generate an engaging, relatable impromptu public speaking prompt tailored specifically for a first-year college student.
Category: "${category}".
Return ONLY a valid JSON object matching this schema:
{
  "topic": string (compelling, thought-provoking, or entertaining title),
  "context": string (real-world classroom, dorm, seminar, or campus scenario),
  "guidingQuestions": string[] (3 bulleted guiding thoughts to help them structure arguments quickly),
  "suggestedStructure": string (e.g. Hook -> 2 Core Points -> Call to Action),
  "timeLimitSeconds": number (between 60 and 120)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error generating impromptu topic:", error);
    res.status(500).json({ error: "Failed to generate topic", details: error.message });
  }
});

// Speech analysis endpoint
app.post("/api/analyze-speech", async (req, res) => {
  try {
    const {
      transcript = "",
      durationSeconds = 60,
      mode = "comm101",
      speechTitle = "Classroom Presentation",
      targetAudience = "College classmates & professor",
    } = req.body;

    const cleanText = transcript.trim();
    if (!cleanText) {
      return res.status(400).json({ error: "No speech transcript provided to analyze." });
    }

    // Local deterministic calculations
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.max(durationSeconds / 60, 0.1);
    const calculatedWpm = Math.round(wordCount / minutes);

    // Common filler word patterns
    const fillerPatterns = [
      { regex: /\bum\b/gi, word: "um" },
      { regex: /\buh\b/gi, word: "uh" },
      { regex: /\blike\b/gi, word: "like" },
      { regex: /\byou know\b/gi, word: "you know" },
      { regex: /\bliterally\b/gi, word: "literally" },
      { regex: /\bkind of\b/gi, word: "kind of" },
      { regex: /\bsort of\b/gi, word: "sort of" },
      { regex: /\bbasically\b/gi, word: "basically" },
      { regex: /\bhonestly\b/gi, word: "honestly" },
      { regex: /\bright\b/gi, word: "right?" },
    ];

    let totalFillers = 0;
    const fillerDetails: Array<{ word: string; count: number }> = [];

    fillerPatterns.forEach(({ regex, word }) => {
      const matches = cleanText.match(regex);
      if (matches && matches.length > 0) {
        totalFillers += matches.length;
        fillerDetails.push({ word, count: matches.length });
      }
    });

    fillerDetails.sort((a, b) => b.count - a.count);
    const fillerPercentage = wordCount > 0 ? Number(((totalFillers / wordCount) * 100).toFixed(1)) : 0;

    let wpmRating: "too_slow" | "optimal" | "too_fast" = "optimal";
    let wpmFeedback = "Great conversational pacing! Your audience can comfortably follow your points.";
    if (calculatedWpm < 115) {
      wpmRating = "too_slow";
      wpmFeedback = "A bit slow or hesitant. Increasing your pace slightly will maintain higher energy.";
    } else if (calculatedWpm > 165) {
      wpmRating = "too_fast";
      wpmFeedback = "Speaking quite fast. Taking deliberate breath pauses between key points will dramatically boost comprehension.";
    }

    const ai = getGenAI();

    if (!ai) {
      // Intelligent supportive fallback analysis
      const baselineScore = Math.max(50, Math.min(95, 82 - totalFillers * 2 + (wpmRating === "optimal" ? 8 : -5)));
      return res.json({
        overallScore: baselineScore,
        toneAssessment: "Supportive, authentic, and engaged delivery",
        confidenceBadge: {
          label: baselineScore >= 80 ? "Confident Presenter" : "Growing Speaker",
          color: baselineScore >= 80 ? "emerald" : "amber",
        },
        metrics: {
          wpm: calculatedWpm,
          wpmRating,
          wpmFeedback,
          wordCount,
          durationSeconds,
          fillerWordsCount: totalFillers,
          fillerWordsList: fillerDetails,
          fillerWordPercentage: fillerPercentage,
          clarityScore: Math.max(60, 90 - totalFillers * 3),
          structureScore: 78,
          engagementScore: 82,
        },
        strengths: [
          "Clear commitment to sharing your ideas openly with the room.",
          "Solid core vocabulary that effectively conveys your central topic.",
          `Natural conversational flow across ${wordCount} words.`,
        ],
        growthAreas: [
          {
            area: "Strategic Pausing",
            suggestion: "When transitioning between thoughts, replace filler words like 'um' or 'like' with a silent 2-second breath.",
            exampleFromSpeech: fillerDetails[0] ? `Notice the use of '${fillerDetails[0].word}' before shifting ideas.` : undefined,
          },
          {
            area: "Pacing & Emphasis",
            suggestion: "Slow down on your most crucial claims so the professor and peers have time to absorb the impact.",
          },
        ],
        openingHookAnalysis: {
          score: 75,
          feedback: "Good direct entry into the topic. Consider beginning with a provocative question or a vivid relatable student anecdote to captivate the room in the first 10 seconds.",
        },
        closingPunchAnalysis: {
          score: 74,
          feedback: "Solid conclusion, but ensure you summarize your primary takeaway with strong vocal conviction rather than trailing off.",
        },
        nextPracticeDrill: {
          title: "The 3-Second Silent Pause Drill",
          description: "Deliver this same speech again, but whenever you feel the urge to say a filler word, close your lips and take a silent 2-second breath.",
          durationMin: 3,
        },
        keyQuotations: words.length > 10 ? [
          {
            quote: words.slice(0, Math.min(12, words.length)).join(" ") + "...",
            note: "Strong introductory framing for your topic.",
            type: "strength",
          },
        ] : [],
      });
    }

    // Call Gemini 3.8 Flash for rich, supportive speech coaching
    const systemPrompt = `You are SpeakReady AI, an expert, warm, and highly supportive public speaking coach specialized in helping first-year college students.
First-year students frequently suffer from imposter syndrome, nervousness, rushing through slides, and speech anxiety.
Your feedback must be genuinely constructive, practical, uplifting, and actionable—never condescending or overly harsh.
Celebrate what they did well, diagnose concrete delivery adjustments, and provide a fun, low-pressure practice drill.`;

    const userPrompt = `Analyze this college student's practice speech delivery.
Speech Title: "${speechTitle}"
Mode / Format: "${mode}"
Audience: "${targetAudience}"
Duration: ${durationSeconds} seconds
Measured Word Count: ${wordCount} words
Measured Pacing: ${calculatedWpm} Words Per Minute (Rating: ${wpmRating})
Detected Filler Words: ${totalFillers} total (${fillerDetails.map(f => `${f.word}: ${f.count}`).join(", ")})

Speech Transcript:
"""
${cleanText}
"""

Provide your expert evaluation as a JSON object adhering strictly to this schema:
{
  "overallScore": number (0-100, balanced and encouraging),
  "toneAssessment": string (e.g., "Passionate & Relatable with Room for Controlled Cadence"),
  "confidenceBadge": {
    "label": string (e.g. "Charismatic Communicator", "Poised Storyteller", "Clear Analyst", "Engaged Explorer"),
    "color": string (e.g. "emerald", "blue", "indigo", "amber")
  },
  "metrics": {
    "wpm": number (${calculatedWpm}),
    "wpmRating": string ("${wpmRating}"),
    "wpmFeedback": string (custom advice on pacing for college presentations),
    "wordCount": number (${wordCount}),
    "durationSeconds": number (${durationSeconds}),
    "fillerWordsCount": number (${totalFillers}),
    "fillerWordsList": [ { "word": string, "count": number } ],
    "fillerWordPercentage": number (${fillerPercentage}),
    "clarityScore": number (0-100),
    "structureScore": number (0-100),
    "engagementScore": number (0-100)
  },
  "strengths": string[] (3-4 specific, uplifting bullet points highlighting what shone in their delivery and rhetoric),
  "growthAreas": [
    {
      "area": string (e.g. "Hook Impact", "Eliminating 'Like'", "Vocal Variety", "Body Rhythm"),
      "suggestion": string (tactical, immediate guidance for their next trial),
      "exampleFromSpeech": string (optional exact snippet from their transcript showing what can improve)
    }
  ],
  "openingHookAnalysis": {
    "score": number (0-100),
    "feedback": string,
    "suggestion": string (concrete idea for an alternate opener)
  },
  "closingPunchAnalysis": {
    "score": number (0-100),
    "feedback": string,
    "suggestion": string (concrete idea for a memorable final sentence)
  },
  "nextPracticeDrill": {
    "title": string (engaging name of a 2-3 minute practice drill),
    "description": string (clear instructions on how to practice this drill right now),
    "durationMin": number
  },
  "keyQuotations": [
    {
      "quote": string (direct phrase from speech),
      "note": string (why this line worked or how to heighten its impact),
      "type": "strength" | "improve"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    // Ensure accurate measured metrics are merged cleanly
    parsed.metrics = {
      ...parsed.metrics,
      wpm: calculatedWpm,
      wpmRating,
      fillerWordsCount: totalFillers,
      fillerWordsList: fillerDetails,
      fillerWordPercentage: fillerPercentage,
      wordCount,
      durationSeconds,
    };

    res.json(parsed);
  } catch (error: any) {
    console.error("Speech analysis error:", error);
    res.status(500).json({ error: "Failed to analyze speech", details: error.message });
  }
});

// Speech rewrite and rhetorical polish endpoint
app.post("/api/speech-rewrite", async (req, res) => {
  try {
    const { sentence = "", goal = "more_persuasive" } = req.body;
    if (!sentence.trim()) {
      return res.status(400).json({ error: "No sentence provided to polish." });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        original: sentence,
        variations: [
          {
            text: `Consider opening directly with: "${sentence.replace(/^(um|like|so|basically)\s*/i, "")}"`,
            explanation: "Removes hesitation markers and establishes immediate presence.",
            styleBadge: "Punchy & Direct",
          },
          {
            text: `Imagine this: ${sentence.replace(/^(i think that|in my opinion)\s*/i, "")}`,
            explanation: "Invites audience visualization without qualifying your perspective.",
            styleBadge: "Vivid Rhetoric",
          },
        ],
      });
    }

    const prompt = `You are a speech coach polishing a first-year college student's speech line.
Original phrase: "${sentence}"
Styling Goal: "${goal}" (options: more_persuasive, more_concise, stronger_hook, natural_conversational).

Provide 3 diverse rewritten options that sound natural when spoken aloud (rhythm, vocal cadence, emphasis).
Return ONLY a JSON object:
{
  "original": "${sentence}",
  "variations": [
    {
      "text": string (the polished spoken line),
      "explanation": string (why this delivery lands better on college listeners),
      "styleBadge": string (e.g. "Authoritative", "Story-Driven", "Concise Punch")
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Speech rewrite error:", error);
    res.status(500).json({ error: "Failed to polish speech phrase", details: error.message });
  }
});

// Text-to-speech demonstration endpoint (optional voice preview of coach tip)
app.post("/api/tts", async (req, res) => {
  try {
    const { text = "Great job with your speech practice! Keep your head up and breathe before every key slide." } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(400).json({ error: "Gemini API key is required for speech synthesis" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.slice(0, 300) }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "No audio generated from model" });
    }

    res.json({ audioBase64: base64Audio });
  } catch (error: any) {
    console.error("TTS error:", error);
    res.status(500).json({ error: "Failed to synthesize speech audio", details: error.message });
  }
});

// Vite middleware and static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SpeakReady AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
