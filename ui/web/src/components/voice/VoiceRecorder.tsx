'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Play, Pause, Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, audioUrl?: string) => void;
  onError?: (error: string) => void;
  language?: string;
  maxDuration?: number; // in seconds
  autoTranscribe?: boolean;
}

interface TranscriptionResult {
  text: string;
  confidence: float;
  language: string;
  entities?: {
    type: string;
    value: string;
    start: number;
    end: number;
  }[];
  suggestedIPCSections?: string[];
}

export function VoiceRecorder({
  onTranscriptionComplete,
  onError,
  language = 'hi-IN', // Default to Hindi
  maxDuration = 300, // 5 minutes
  autoTranscribe = true,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Supported languages for speech recognition
  const supportedLanguages = [
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'en-IN', name: 'English (India)' },
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'ml-IN', name: 'Malayalam' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'bn-IN', name: 'Bengali' },
    { code: 'gu-IN', name: 'Gujarati' },
    { code: 'pa-IN', name: 'Punjabi' },
    { code: 'or-IN', name: 'Odia' },
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255 * 100);

    animationRef.current = requestAnimationFrame(updateAudioLevel);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Setup media recorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Auto-transcribe if enabled
        if (autoTranscribe && blob.size > 0) {
          transcribeAudio(blob);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start audio level visualization
      updateAudioLevel();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      onError?.(message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        updateAudioLevel();
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', language);

      // Call transcription API
      const response = await fetch('/api/v1/ml/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result: TranscriptionResult = await response.json();
      setTranscription(result);
      onTranscriptionComplete(result.text, audioUrl || undefined);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
      onError?.(message);

      // Fallback: Use Web Speech API if available
      if ('webkitSpeechRecognition' in window) {
        tryWebSpeechAPI(blob);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const tryWebSpeechAPI = (blob: Blob) => {
    // This is a fallback using browser's speech recognition
    // Note: This won't work with a blob directly in most browsers
    // It's here as a demonstration of the fallback pattern
    console.log('Attempting Web Speech API fallback...');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setTranscription(null);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Input
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Language:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={language}
            onChange={(e) => {
              // Would need to lift state up to parent for this
            }}
            disabled={isRecording}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording && !audioBlob && (
            <Button
              size="lg"
              onClick={startRecording}
              className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600"
            >
              <Mic className="h-8 w-8" />
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                size="lg"
                variant="outline"
                onClick={pauseRecording}
                className="rounded-full h-12 w-12"
              >
                {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
              </Button>
              <Button
                size="lg"
                onClick={stopRecording}
                className="rounded-full h-16 w-16 bg-gray-800 hover:bg-gray-900"
              >
                <Square className="h-8 w-8" />
              </Button>
            </>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button
                variant="outline"
                onClick={resetRecording}
              >
                Record Again
              </Button>
              {!autoTranscribe && (
                <Button
                  onClick={() => transcribeAudio(audioBlob)}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Transcribe
                </Button>
              )}
            </>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-1 ${isPaused ? 'text-yellow-500' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                {isPaused ? 'Paused' : 'Recording'}
              </span>
              <span className="font-mono">{formatDuration(duration)} / {formatDuration(maxDuration)}</span>
            </div>

            {/* Audio Level Meter */}
            <Progress value={audioLevel} className="h-2" />

            {/* Duration Progress */}
            <Progress value={(duration / maxDuration) * 100} className="h-1" />
          </div>
        )}

        {/* Audio Playback */}
        {audioUrl && !isRecording && (
          <div className="border rounded-lg p-3">
            <audio controls src={audioUrl} className="w-full" />
            <p className="text-xs text-gray-500 mt-1">
              Duration: {formatDuration(duration)}
            </p>
          </div>
        )}

        {/* Transcription Status */}
        {isTranscribing && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Transcribing audio...</span>
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                Transcription Complete
              </span>
              <span className="text-xs text-gray-500">
                Confidence: {(transcription.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="text-sm whitespace-pre-wrap">{transcription.text}</p>
            </div>

            {/* Extracted Entities */}
            {transcription.entities && transcription.entities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Detected Entities:</p>
                <div className="flex flex-wrap gap-1">
                  {transcription.entities.map((entity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {entity.type}: {entity.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested IPC Sections */}
            {transcription.suggestedIPCSections && transcription.suggestedIPCSections.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Suggested IPC Sections:</p>
                <div className="flex flex-wrap gap-1">
                  {transcription.suggestedIPCSections.map((section, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 italic">
              AI transcription requires verification. Please review and correct if needed.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VoiceRecorder;
