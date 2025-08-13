import Image from 'next/image';

export default function Header() {
  return (
    <header className="text-center mb-8">
      <div className="flex justify-center items-center gap-6 mb-8">
        <Image src="/Deliver.png" alt="Deliver Logo" width={120} height={38} />
        <Image src="/EU_logo.png" alt="EU Logo" width={180} height={60} />
        <Image src="/manchester_logo.png" alt="University of Manchester" width={140} height={42} />
      </div>
    </header>
  );
}
