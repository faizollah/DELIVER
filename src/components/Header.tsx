import Image from 'next/image';

export default function Header() {
  return (
    <header className="text-center mb-12">
      <div className="flex justify-center items-center gap-4 mb-4">
        <Image src="/Deliver.svg" alt="Deliver Logo" width={100} height={50} />
        <Image src="/EU_logo.svg" alt="EU Logo" width={100} height={50} />
        <Image src="/manchester_logo.png" alt="Manchester Logo" width={100} height={50} />
      </div>
      <h1 className="text-5xl font-bold text-blue-600 mb-2">DELIVER</h1>
      <p className="text-lg text-gray-600">Your AI-powered dental feedback analysis tool.</p>
    </header>
  );
}
