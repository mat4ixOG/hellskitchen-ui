/**
 * Voice in and voice out, both optional and both feature-detected.
 *
 * The Web Speech API is still prefixed in most browsers and simply absent in
 * some, so everything here degrades to "the button is not shown" rather than
 * throwing. It is also entirely browser-side — nothing here runs during SSR.
 */

// The DOM lib does not ship these; this is the shape actually used.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as Record<string, unknown>;
  return (scope['SpeechRecognition'] ?? scope['webkitSpeechRecognition'] ?? null) as
    | SpeechRecognitionCtor
    | null;
}

export function dictationSupported(): boolean {
  return recognitionCtor() !== null;
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface DictationHandlers {
  /** Fires as the user speaks — `final` says whether it will still change. */
  onTranscript: (text: string, final: boolean) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

/**
 * A microphone session. `stop()` ends it politely and keeps what was heard;
 * `cancel()` throws it away.
 */
export class HkDictation {
  private recognition: SpeechRecognitionLike | null = null;
  private cancelled = false;

  constructor(private readonly handlers: DictationHandlers) {}

  get active(): boolean {
    return this.recognition !== null;
  }

  start(lang = 'en-US'): boolean {
    const Ctor = recognitionCtor();
    if (!Ctor || this.recognition) return false;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    // Interim results are what make dictation feel live rather than laggy.
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final) this.handlers.onTranscript(final, true);
      else if (interim) this.handlers.onTranscript(interim, false);
    };

    recognition.onerror = (event) => {
      // `aborted` is what `cancel()` itself causes; not worth reporting.
      if (event.error === 'aborted' || this.cancelled) return;
      this.handlers.onError(
        event.error === 'not-allowed'
          ? 'Microphone permission was denied.'
          : `Dictation error: ${event.error}`
      );
    };

    recognition.onend = () => {
      this.recognition = null;
      this.handlers.onEnd();
    };

    this.recognition = recognition;
    this.cancelled = false;
    try {
      recognition.start();
      return true;
    } catch {
      this.recognition = null;
      return false;
    }
  }

  stop(): void {
    this.recognition?.stop();
  }

  cancel(): void {
    this.cancelled = true;
    this.recognition?.abort();
    this.recognition = null;
  }
}

/**
 * Speaks assistant replies.
 *
 * Chunked by sentence on purpose: a single utterance of a long reply cannot be
 * stopped cleanly mid-way in several browsers, and queueing sentences also lets
 * speech start before the stream has finished arriving.
 */
export class HkSpeaker {
  private queue: string[] = [];
  private speaking = false;

  get available(): boolean {
    return speechSupported();
  }

  speak(text: string): void {
    if (!this.available) return;
    const clean = text.trim();
    if (!clean) return;
    const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) ?? [clean];
    this.queue.push(...sentences.map((s) => s.trim()).filter(Boolean));
    if (!this.speaking) this.drain();
  }

  private drain(): void {
    const next = this.queue.shift();
    if (next === undefined) {
      this.speaking = false;
      return;
    }
    this.speaking = true;
    const utterance = new SpeechSynthesisUtterance(next);
    utterance.onend = () => this.drain();
    // A failed utterance must not strand the queue.
    utterance.onerror = () => this.drain();
    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    this.queue = [];
    this.speaking = false;
    if (this.available) window.speechSynthesis.cancel();
  }
}
