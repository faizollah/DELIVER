import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Image src="/Deliver.svg" alt="Deliver Logo" width={100} height={50} />
            <Image src="/EU_logo.svg" alt="EU Logo" width={100} height={50} />
            <Image src="/manchester_logo.png" alt="Manchester Logo" width={100} height={50} />
          </div>
          <h1 className="text-5xl font-bold text-blue-600 mb-2">Welcome to DELIVER</h1>
          <p className="text-lg text-gray-600">Your AI-powered dental feedback analysis tool.</p>
        </header>

        <main className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Analyse a Single Review</h2>
            <p className="mb-6 text-gray-600">Get in-depth insights from a single patient review.</p>
            <Link href="/analysis/single" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300">
              Get Started
            </Link>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Analyse Google Maps Reviews</h2>
            <p className="mb-6 text-gray-600">Analyse all Google Maps reviews for a dental practice.</p>
            <Link href="/analysis/practice" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300">
              Get Started
            </Link>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500">
          <p>&copy; 2024 DELIVER. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
