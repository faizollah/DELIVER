import Image from 'next/image';

export default function Header() {
  return (
    <header className="text-center mb-12">
      <div className="flex justify-center items-center gap-6 mb-4">
        <Image src="/Deliver.png" alt="Deliver Logo" width={120} height={38} />
        <Image src="/EU_logo.png" alt="EU Logo" width={180} height={60} />
        <Image src="/manchester_logo.png" alt="University of Manchester" width={140} height={42} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">DELIVER</h1>
      <p className="mt-1 text-slate-600">Evidence‑driven analysis of dental patient feedback to surface sentiment, themes, and opportunities for better care.</p>
    </header>
  );
}
