import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(14,165,233,0.15),transparent)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
      </div>

      <header className="container mx-auto px-6 pt-10">
        <div className="flex items-center gap-4">
          <Image src="/Deliver.svg" alt="Deliver" width={90} height={28} />
          <Image src="/EU_logo.svg" alt="EU" width={70} height={24} />
          <Image src="/manchester_logo.png" alt="Manchester" width={100} height={30} />
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
              Turn patient feedback into{' '}
              <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                clinical insight
              </span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              AI-powered analysis for single reviews and full-practice Google reviews—fast, accurate, and privacy‑safe.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/analysis/single"
                className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:shadow-xl hover:brightness-110"
              >
                Analyze a Single Review
              </Link>
              <Link
                href="/analysis/practice"
                className="rounded-full border border-slate-200/70 bg-white/60 px-6 py-3 font-semibold text-slate-800 backdrop-blur transition hover:bg-white"
              >
                Analyze Practice Reviews
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 opacity-80">
              <Image src="/Deliver.svg" alt="Deliver" width={80} height={26} />
              <Image src="/EU_logo.svg" alt="EU" width={60} height={22} />
              <Image src="/manchester_logo.png" alt="Manchester" width={90} height={28} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative hidden md:block">
            <div className="mx-auto h-80 w-full max-w-lg rounded-3xl border border-white/10 bg-white/60 p-6 backdrop-blur shadow-xl">
              <div className="h-full rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50" />
            </div>
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-2xl bg-sky-400/30 blur-xl" />
          </motion.div>
        </div>

        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mx-auto mt-16 grid max-w-7xl gap-6 md:grid-cols-2">
          <Link href="/analysis/single" className="group rounded-2xl border border-white/10 bg-white/70 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">✦</div>
            <h3 className="text-xl font-semibold text-slate-900">Analyze a Single Review</h3>
            <p className="mt-1 text-slate-600">Deep insights from one patient’s feedback.</p>
          </Link>

          <Link href="/analysis/practice" className="group rounded-2xl border border-white/10 bg-white/70 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">◎</div>
            <h3 className="text-xl font-semibold text-slate-900">Analyze Google Maps Reviews</h3>
            <p className="mt-1 text-slate-600">Aggregate sentiment and themes across your practice.</p>
          </Link>
        </motion.section>
      </main>

      <footer className="container mx-auto px-6 py-12 text-sm text-slate-500">© 2024 DELIVER. All rights reserved.</footer>
    </div>
  );
}
