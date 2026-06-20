'use client';

import { useState, useEffect } from 'react';

/**
 * Escribe frases con efecto mecanográfico.
 * - loop=true: escribe, pausa, borra y pasa a la siguiente (About).
 * - loop=false: escribe una vez y termina (Hero).
 */
export default function TypewriterCycle({
  phrases = [],
  typingMs = 55,
  pauseMs = 2200,
  deletingMs = 32,
  className = '',
  active = true,
  loop = true,
  hideCursorWhenDone = true,
  trailingComma = false,
}) {
  const [display, setDisplay] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState('typing');
  const [done, setDone] = useState(false);
  const phrasesKey = phrases.join('\u0000');

  useEffect(() => {
    setDisplay('');
    setPhraseIndex(0);
    setPhase('typing');
    setDone(false);
  }, [phrasesKey]);

  useEffect(() => {
    if (!active || phrases.length === 0 || done) return;

    const phrase = phrases[phraseIndex % phrases.length];
    let delay = typingMs;

    if (phase === 'pausing') delay = pauseMs;
    if (phase === 'deleting') delay = deletingMs;

    const timer = setTimeout(() => {
      if (phase === 'typing') {
        if (display.length < phrase.length) {
          setDisplay(phrase.slice(0, display.length + 1));
        } else if (loop) {
          setPhase('pausing');
        } else {
          setDone(true);
        }
        return;
      }

      if (phase === 'pausing') {
        setPhase('deleting');
        return;
      }

      if (display.length > 0) {
        setDisplay(phrase.slice(0, display.length - 1));
      } else {
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setPhase('typing');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    active,
    display,
    phase,
    phraseIndex,
    phrases,
    phrasesKey,
    typingMs,
    pauseMs,
    deletingMs,
    loop,
    done,
  ]);

  const phrase = phrases[phraseIndex % phrases.length] ?? '';
  const phraseComplete = phrase.length > 0 && display.length === phrase.length;
  const showTrailingComma =
    trailingComma && phraseComplete && phase !== 'deleting';
  const showCursor =
    active &&
    phrases.length > 0 &&
    !(hideCursorWhenDone && done) &&
    ((phase === 'typing' && !phraseComplete) || phase === 'deleting');

  return (
    <span className={className}>
      {display}
      {showTrailingComma ? ',' : ''}
      {showCursor && (
        <span className="animate-pulse" aria-hidden="true">
          |
        </span>
      )}
    </span>
  );
}
