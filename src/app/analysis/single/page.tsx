import Header from '@/components/Header';
import SingleReviewForm from '@/components/SingleReviewForm';

export default function SingleReviewPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <main className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Analyze a Single Review</h2>
            <SingleReviewForm />
          </div>
        </main>
      </div>
    </div>
  );
}
