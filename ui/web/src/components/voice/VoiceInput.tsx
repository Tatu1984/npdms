'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Play, Pause, Loader2, Volume2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onAudioFile?: (file: Blob) => void;
  language?: string;
  placeholder?: string;
  className?: string;
}

export default function VoiceInput({
  onTranscription,
  onAudioFile,
  language = 'en-IN',
  placeholder = 'Click the microphone to start recording...',
  className = '',
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }

          if (final) {
            setTranscription((prev) => prev + final);
            onTranscription(transcription + final);
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access.');
          } else {
            setError(`Recognition error: ${event.error}`);
          }
          stopRecording();
        };

        recognition.onend = () => {
          if (isRecording) {
            // Restart if still recording
            recognition.start();
          }
        };

        recognitionRef.current = recognition;
      } else {
        setError('Speech recognition is not supported in this browser.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [language]);

  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
    }
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = async () => {
    setError(null);
    setTranscription('');
    setInterimTranscript('');
    setDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio analyser for level visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Setup media recorder for audio file
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (onAudioFile) {
          onAudioFile(audioBlob);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start audio level monitoring
      updateAudioLevel();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setAudioLevel(0);

    // Finalize transcription
    setTimeout(() => {
      const finalText = transcription + interimTranscript;
      if (finalText.trim()) {
        onTranscription(finalText.trim());
      }
      setIsProcessing(false);
    }, 500);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Status and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                variant={isRecording ? 'destructive' : 'default'}
                size="lg"
                className="rounded-full w-14 h-14"
              >
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>

              <div>
                <div className="font-medium">
                  {isProcessing
                    ? 'Processing...'
                    : isRecording
                    ? 'Recording...'
                    : 'Ready to record'}
                </div>
                {isRecording && (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {formatDuration(duration)}
                  </div>
                )}
              </div>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: `${audioLevel * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Audio Level Visualization */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-12">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.random() * audioLevel * 100 + 10}%`,
                    opacity: 0.5 + audioLevel * 0.5,
                  }}
                />
              ))}
            </div>
          )}

          {/* Transcription Display */}
          <div className="min-h-[100px] p-4 bg-gray-50 rounded-lg">
            {transcription || interimTranscript ? (
              <div>
                <span className="text-gray-900">{transcription}</span>
                <span className="text-gray-400">{interimTranscript}</span>
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <MicOff className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Language Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              Language: {language === 'en-IN' ? 'English (India)' : language === 'hi-IN' ? 'Hindi' : language}
            </Badge>
            {transcription && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTranscription('');
                  setInterimTranscript('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
