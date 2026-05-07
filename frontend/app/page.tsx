"use client";

import { useState, useEffect } from "react";

interface Summary {
  summary: string;
  key_points: string[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [transcript, setTranscript] = useState("");
  const [transcriptChunks, setTranscriptChunks] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [isHealthy, setIsHealthy] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/health");
        setIsHealthy(response.ok);
      } catch {
        setIsHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTranscribe = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setError("");
    setIsTranscribing(true);
    setTranscript("");
    setTranscriptChunks([]);
    setSummary(null);

    try {
      // Stream transcription via SSE
      const response = await fetch(
        "http://localhost:8000/api/transcribe-stream",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtube_url: url,
            transcription_model: "gemini-3-flash-preview",
            target_language: language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      let fullTranscript = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.substring(7);

            if (eventType === "chunk") {
              // Read next line for data
              const nextLineIdx = lines.indexOf(line) + 1;
              if (nextLineIdx < lines.length) {
                const dataLine = lines[nextLineIdx];
                if (dataLine.startsWith("data: ")) {
                  const data = JSON.parse(dataLine.substring(6));
                  const text = data.text || "";
                  fullTranscript += text + "\n";
                  setTranscriptChunks((prev) => [...prev, text]);
                  setTranscript(fullTranscript);
                }
              }
            } else if (eventType === "done") {
              // Transcription complete, proceed to summarization
              setIsTranscribing(false);
              setIsSummarizing(true);

              // Auto-summarize
              try {
                const summaryResponse = await fetch(
                  "http://localhost:8000/api/summarize-transcript",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      transcript: fullTranscript,
                      summary_model: "gemini-3-flash-preview",
                      target_language: language,
                    }),
                  }
                );

                if (!summaryResponse.ok) {
                  throw new Error(`HTTP ${summaryResponse.status}`);
                }

                const summaryData: Summary = await summaryResponse.json();
                setSummary(summaryData);
              } catch (summaryError) {
                setError(
                  `Summarization failed: ${summaryError instanceof Error ? summaryError.message : "Unknown error"}`
                );
              } finally {
                setIsSummarizing(false);
              }
            } else if (eventType === "error") {
              // Read error details
              const nextLineIdx = lines.indexOf(line) + 1;
              if (nextLineIdx < lines.length) {
                const dataLine = lines[nextLineIdx];
                if (dataLine.startsWith("data: ")) {
                  const data = JSON.parse(dataLine.substring(6));
                  setError(data.detail || "Transcription failed");
                }
              }
              setIsTranscribing(false);
            }
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to transcribe video"
      );
      setIsTranscribing(false);
      setIsSummarizing(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setTranscript("");
    setTranscriptChunks([]);
    setSummary(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-nypl-gray-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-nypl-red">
            YouTube Summarizer
          </h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isHealthy ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {isHealthy ? "Connected" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-nypl-gray mb-2">
                YouTube URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isTranscribing || isSummarizing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-nypl-red focus:ring-1 focus:ring-nypl-red disabled:bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-nypl-gray mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isTranscribing || isSummarizing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-nypl-red focus:ring-1 focus:ring-nypl-red disabled:bg-gray-100"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="it">Italian</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleTranscribe}
                  disabled={
                    isTranscribing ||
                    isSummarizing ||
                    !url.trim() ||
                    !isHealthy
                  }
                  className="w-full px-6 py-2 bg-nypl-red text-white font-medium rounded-lg hover:bg-nypl-red-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {isTranscribing ? "Transcribing..." : "Transcribe"}
                </button>
                {(transcript || summary) && (
                  <button
                    onClick={handleReset}
                    disabled={isTranscribing || isSummarizing}
                    className="px-4 py-2 bg-gray-200 text-nypl-gray font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {(transcript || summary) && (
          <div className="grid grid-cols-2 gap-8">
            {/* Transcript Panel */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-nypl-gray mb-4">
                Transcript
              </h2>
              <div className="h-96 overflow-y-auto p-4 bg-gray-50 rounded border border-gray-200">
                {transcriptChunks.length > 0 ? (
                  <div className="space-y-2 text-sm leading-relaxed">
                    {transcriptChunks.map((chunk, idx) => (
                      <p key={idx} className="text-gray-700">
                        {chunk}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">
                    Waiting for transcript...
                  </p>
                )}
              </div>
            </div>

            {/* Summary Panel */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-nypl-gray mb-4">
                Summary
              </h2>

              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nypl-red mb-4" />
                  <p>Generating summary...</p>
                </div>
              ) : summary ? (
                <div className="h-96 overflow-y-auto p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-nypl-gray mb-2">
                        Overview
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-700">
                        {summary.summary}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-nypl-gray mb-2">
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {summary.key_points.map((point, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 flex gap-2"
                          >
                            <span className="text-nypl-red font-bold flex-shrink-0">
                              •
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-400">
                  <p>Summary will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!transcript && !summary && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">
              Paste a YouTube URL and click Transcribe to get started
            </p>
            <p className="text-sm">
              The transcript and summary will appear side by side
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
