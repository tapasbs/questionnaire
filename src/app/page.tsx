export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_70%_-10%,rgba(59,130,246,0.22),transparent_65%),radial-gradient(900px_500px_at_-20%_20%,rgba(168,85,247,0.18),transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-end p-6">
        <a
          href="/signin"
          className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Sign in
        </a>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-80px)]" />
    </div>
  );
}
