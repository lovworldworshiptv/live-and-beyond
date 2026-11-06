import { useEffect, useMemo, useState } from "react";

type Done = (score: number) => void;

const TRIVIA = [
  { q: "What does LETTFLIX stand for?", a: ["LoveWorld Entertainment Flix", "Live Event TV Flix", "Lagos Entertainment Flix", "Let The Film Flow"], c: 0 },
  { q: "Which book of the Bible comes first?", a: ["Exodus", "Genesis", "Psalms", "Matthew"], c: 1 },
  { q: "How many frames per second is standard cinema?", a: ["12", "24", "60", "120"], c: 1 },
  { q: "What is a live broadcast's delay buffer often called?", a: ["Lag lock", "Broadcast delay", "Frame skip", "Stream cap"], c: 1 },
  { q: "Who led the Israelites out of Egypt?", a: ["David", "Moses", "Joshua", "Elijah"], c: 1 },
  { q: "What does 'HD' stand for?", a: ["High Definition", "Home Display", "Hyper Digital", "High Drive"], c: 0 },
  { q: "Which is a podcast format?", a: ["Audio episodes", "Printed magazine", "Billboard", "Postcard"], c: 0 },
  { q: "How many disciples did Jesus choose?", a: ["7", "10", "12", "40"], c: 2 },
];

export function TriviaBlitz({ onDone }: { onDone: Done }) {
  const qs = useMemo(() => [...TRIVIA].sort(() => Math.random() - 0.5).slice(0, 5), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(10);
  const q = qs[i];
  useEffect(() => {
    if (picked !== null) return;
    if (time <= 0) { choose(-1); return; }
    const id = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(id);
  });
  function choose(n: number) {
    if (picked !== null) return;
    setPicked(n);
    const gained = n === q.c ? 100 + time * 10 : 0;
    const total = score + gained;
    setScore(total);
    setTimeout(() => {
      if (i + 1 >= qs.length) onDone(total);
      else { setI(i + 1); setPicked(null); setTime(10); }
    }, 900);
  }
  return (
    <div className="grid gap-4">
      <div className="flex justify-between text-sm text-muted-foreground"><span>Question {i + 1} of {qs.length}</span><span aria-live="polite">{time}s · {score} pts</span></div>
      <div className="h-1 rounded bg-foreground/10"><div className="h-full rounded transition-all" style={{ width: `${time * 10}%`, background: "var(--game-pink)" }} /></div>
      <h3 className="text-xl font-bold">{q.q}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.a.map((a, n) => {
          const state = picked === null ? "" : n === q.c ? "border-[color:var(--game-mint)] bg-[color:var(--game-mint)]/20" : n === picked ? "border-primary bg-primary/20" : "opacity-60";
          return <button key={a} type="button" onClick={() => choose(n)} className={`min-h-12 rounded-lg border border-border px-4 text-left font-medium transition hover:border-foreground ${state}`}>{a}</button>;
        })}
      </div>
    </div>
  );
}

const WORDS = ["CINEMA", "STREAM", "PRAISE", "SERIES", "RADIO", "GOSPEL", "CAMERA", "STUDIO", "SCREEN", "CHOIR"];

export function WordScramble({ onDone }: { onDone: Done }) {
  const list = useMemo(() => [...WORDS].sort(() => Math.random() - 0.5).slice(0, 4), []);
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("");
  const word = list[i];
  const scrambled = useMemo(() => {
    let s = word;
    while (s === word) s = word.split("").sort(() => Math.random() - 0.5).join("");
    return s;
  }, [word]);
  const next = (gain: number) => {
    const total = score + gain;
    setScore(total); setGuess("");
    if (i + 1 >= list.length) onDone(total); else setI(i + 1);
  };
  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (guess.toUpperCase() === word) { setMsg("Correct!"); next(150); } else setMsg("Not quite, try again."); }}>
      <div className="flex justify-between text-sm text-muted-foreground"><span>Word {i + 1} of {list.length}</span><span>{score} pts</span></div>
      <div className="flex flex-wrap justify-center gap-2">
        {scrambled.split("").map((ch, n) => <span key={n} className="grid size-11 sm:size-12 place-items-center rounded-lg text-xl font-black text-background" style={{ background: "var(--game-aqua)" }}>{ch}</span>)}
      </div>
      <input data-allow-copy autoFocus value={guess} onChange={(e) => setGuess(e.target.value)} aria-label="Your answer" className="h-12 rounded-lg border border-border bg-background px-4 text-center text-lg uppercase tracking-widest" />
      <p className="text-center text-sm text-muted-foreground min-h-5" aria-live="polite">{msg}</p>
      <div className="flex gap-2 justify-center"><button type="button" onClick={() => { setMsg(`It was ${word}`); next(0); }} className="h-11 px-4 rounded-lg border border-border">Skip</button><button className="h-11 px-6 rounded-lg bg-foreground text-background font-bold">Check</button></div>
    </form>
  );
}

const ICONS = ["🎬", "📻", "🎤", "📺", "🎵", "🎧"];

export function PosterFlip({ onDone }: { onDone: Done }) {
  const deck = useMemo(() => [...ICONS, ...ICONS].sort(() => Math.random() - 0.5), []);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  function flip(n: number) {
    if (open.length === 2 || open.includes(n) || matched.includes(n)) return;
    const o = [...open, n];
    setOpen(o);
    if (o.length === 2) {
      setMoves((m) => m + 1);
      setTimeout(() => {
        if (deck[o[0]] === deck[o[1]]) {
          const m = [...matched, ...o];
          setMatched(m);
          if (m.length === deck.length) onDone(Math.max(100, 1000 - (moves + 1 - 6) * 60));
        }
        setOpen([]);
      }, 700);
    }
  }
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Moves: {moves} · Pairs: {matched.length / 2} of 6</p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {deck.map((ic, n) => {
          const show = open.includes(n) || matched.includes(n);
          return <button key={n} type="button" aria-label={show ? ic : "Hidden card"} onClick={() => flip(n)} className="aspect-square rounded-lg text-3xl grid place-items-center transition" style={{ background: show ? "var(--elevated)" : "var(--game-mint)", opacity: matched.includes(n) ? 0.5 : 1 }}>{show ? ic : ""}</button>;
        })}
      </div>
    </div>
  );
}
