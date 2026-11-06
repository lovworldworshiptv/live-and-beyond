import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { Play, Info, Trophy, Brain, Type, LayoutGrid, Target, Music, Rocket } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TriviaBlitz, WordScramble, PosterFlip } from "@/components/games/mini-games";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Games — Lettflix" },
      { name: "description", content: "Play quick trivia, word and memory games on Lettflix, and climb your best scores." },
      { property: "og:title", content: "Lettflix Games" },
      { property: "og:description", content: "Quick games included with Lettflix: trivia, word scramble and poster flip." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesPage,
});

type GameId = "trivia" | "word" | "flip";
type Game = { id: GameId | string; name: string; genre: string; blurb: string; color: string; icon: typeof Brain; ready: boolean };

const GAMES: Game[] = [
  { id: "trivia", name: "Trivia Blitz", genre: "Quiz", blurb: "Five questions, ten seconds each. Faster answers score more.", color: "var(--game-pink)", icon: Brain, ready: true },
  { id: "word", name: "LettWord", genre: "Word", blurb: "Unscramble four words from film, faith and broadcast.", color: "var(--game-aqua)", icon: Type, ready: true },
  { id: "flip", name: "Poster Flip", genre: "Memory", blurb: "Match six pairs in as few moves as you can.", color: "var(--game-mint)", icon: LayoutGrid, ready: true },
  { id: "predict", name: "Predict & Win", genre: "Prediction", blurb: "Call what happens next on live shows.", color: "var(--game-violet)", icon: Target, ready: false },
  { id: "tune", name: "Tune Drop", genre: "Music", blurb: "Name the song from a radio clip.", color: "var(--game-blue)", icon: Music, ready: false },
  { id: "runner", name: "Reel Runner", genre: "Arcade", blurb: "Dodge and dash through the film reel.", color: "var(--game-tangerine)", icon: Rocket, ready: false },
];

const KEY = "lettflix.game-best";
const EVT = "lettflix:game-best";
let cache: Record<string, number> | null = null;
const readBest = () => {
  if (typeof window === "undefined") return {};
  if (!cache) { try { cache = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { cache = {}; } }
  return cache!;
};
const EMPTY = {};
function useBest() {
  const best = useSyncExternalStore((cb) => { window.addEventListener(EVT, cb); return () => window.removeEventListener(EVT, cb); }, readBest, () => EMPTY as Record<string, number>);
  const record = (id: string, s: number) => {
    const next = { ...readBest(), [id]: Math.max(readBest()[id] ?? 0, s) };
    localStorage.setItem(KEY, JSON.stringify(next)); cache = next; window.dispatchEvent(new Event(EVT));
  };
  return { best, record };
}

function GameTile({ g, best, onOpen }: { g: Game; best?: number; onOpen: () => void }) {
  const Icon = g.icon;
  return (
    <button type="button" onClick={onOpen} className="group shrink-0 snap-start w-[30vw] sm:w-36 lg:w-44 text-left focus-visible:outline-none">
      <div className="relative aspect-square rounded-2xl grid place-items-center overflow-hidden transition group-hover:scale-[1.03] ring-offset-2 ring-offset-background group-focus-visible:ring-2 group-focus-visible:ring-foreground" style={{ background: `linear-gradient(145deg, ${g.color}, color-mix(in oklab, ${g.color} 45%, var(--background)))` }}>
        <Icon className="size-1/2 text-foreground drop-shadow-lg" strokeWidth={2.2} />
        {!g.ready && <span className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold bg-background/75">Coming soon</span>}
      </div>
      <p className="mt-2 text-sm font-semibold leading-tight">{g.name}</p>
      <p className="text-xs text-muted-foreground">{best ? `Best ${best} pts` : g.genre}</p>
    </button>
  );
}

function GamesPage() {
  const { best, record } = useBest();
  const [open, setOpen] = useState<Game | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const hero = GAMES[0];
  const total = Object.values(best).reduce((a, b) => a + b, 0);

  const start = (g: Game) => { setOpen(g); setResult(null); setRound((r) => r + 1); };
  const finish = (s: number) => { if (open) record(String(open.id), s); setResult(s); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader overlay />
      <section className="relative overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20 px-4 sm:px-8 lg:px-12" style={{ background: "radial-gradient(90% 90% at 80% 30%, color-mix(in oklab, var(--game-pink) 55%, transparent), transparent 60%), radial-gradient(70% 80% at 10% 100%, color-mix(in oklab, var(--game-violet) 60%, transparent), transparent 60%), var(--background)" }}>
        <div className="mx-auto max-w-[1480px] grid gap-10 md:grid-cols-[1fr_auto] items-center">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-foreground/80">Included with Lettflix</p>
            <h1 className="mt-2 text-4xl sm:text-6xl font-black tracking-tight leading-[0.95]">{hero.name}</h1>
            <p className="mt-3 text-sm text-foreground/80">Quick game · {hero.genre} · All ages</p>
            <p className="mt-3 text-base text-foreground/85">{hero.blurb}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => start(hero)} className="inline-flex items-center gap-2 h-11 px-7 rounded bg-foreground text-background font-bold hover:bg-foreground/80"><Play className="size-5 fill-current" />Play now</button>
              <a href="#all-games" className="inline-flex items-center gap-2 h-11 px-6 rounded bg-muted-foreground/40 backdrop-blur font-bold hover:bg-muted-foreground/30"><Info className="size-5" />All games</a>
            </div>
            {total > 0 && <p className="mt-6 inline-flex items-center gap-2 text-sm"><Trophy className="size-4" style={{ color: "var(--game-sun)" }} />Your best scores add up to <strong>{total.toLocaleString()} pts</strong></p>}
          </div>
          <div className="hidden md:block w-56 lg:w-64 aspect-[9/19] rounded-[2.5rem] border-8 border-foreground/15 bg-elevated p-4 shadow-2xl rotate-3">
            <div className="h-full rounded-[1.6rem] grid place-items-center text-center p-4" style={{ background: "linear-gradient(160deg, var(--game-pink), var(--game-violet))" }}>
              <div><Brain className="mx-auto size-16" /><p className="mt-3 font-black text-2xl">Trivia Blitz</p><p className="text-sm text-foreground/80 mt-1">10 seconds. Go.</p></div>
            </div>
          </div>
        </div>
      </section>

      <div id="all-games" className="pb-16 scroll-mt-20">
        <section className="mt-8 px-4 sm:px-8 lg:px-12">
          <h2 className="mb-3 text-lg sm:text-2xl font-bold">Play right now</h2>
          <div className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-none snap-x pb-2">
            {GAMES.filter((g) => g.ready).map((g) => <GameTile key={g.id} g={g} best={best[g.id]} onOpen={() => start(g)} />)}
          </div>
        </section>
        <section className="mt-10 px-4 sm:px-8 lg:px-12">
          <h2 className="mb-3 text-lg sm:text-2xl font-bold">Coming to Lettflix Games</h2>
          <div className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-none snap-x pb-2">
            {GAMES.filter((g) => !g.ready).map((g) => <GameTile key={g.id} g={g} onOpen={() => start(g)} />)}
          </div>
        </section>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          {open && <>
            <DialogHeader>
              <DialogTitle>{open.name}</DialogTitle>
              <DialogDescription>{open.blurb}</DialogDescription>
            </DialogHeader>
            {!open.ready ? <p className="text-muted-foreground">This game is on the way. Try one of the games you can play now.</p>
              : result !== null ? (
                <div className="text-center py-4">
                  <Trophy className="mx-auto size-12" style={{ color: "var(--game-sun)" }} />
                  <p className="mt-3 text-3xl font-black">{result} pts</p>
                  <p className="text-sm text-muted-foreground">Best: {best[open.id] ?? result} pts</p>
                  <button type="button" onClick={() => start(open)} className="mt-5 h-11 px-6 rounded bg-foreground text-background font-bold">Play again</button>
                </div>
              ) : open.id === "trivia" ? <TriviaBlitz key={round} onDone={finish} />
              : open.id === "word" ? <WordScramble key={round} onDone={finish} />
              : <PosterFlip key={round} onDone={finish} />}
          </>}
        </DialogContent>
      </Dialog>
      <SiteFooter />
    </div>
  );
}
