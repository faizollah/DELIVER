import { getPracticeDetails, analyzePracticeReviews } from '@/app/actions';
import Header from '@/components/Header';
import PracticeAnalysis from '@/components/PracticeAnalysis';

function aggregateResults(sentimentResults: any[], multilabelResults: any[]) {
    const sentimentCounts: { [key: string]: number } = {};
    const labelCounts: { [key: string]: number } = {};

    sentimentResults.forEach(result => {
        const sentiment = result[1].sentiment;
        sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
    });

    multilabelResults.forEach(result => {
        result[1].predicted_labels.forEach((label: string) => {
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
    });

    return { sentimentCounts, labelCounts };
}

export default async function PracticeAnalysisPage({ params }: { params: { place_id: string } }) {
    const practiceDetails = await getPracticeDetails(params.place_id);
    const reviews = practiceDetails.reviews || [];
    const analysisResults = await analyzePracticeReviews(reviews);
    const aggregatedResults = aggregateResults(analysisResults.sentimentBatchResults, analysisResults.multilabelBatchResults);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Header />
                <main className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-3xl font-bold text-center mb-8">{practiceDetails.name} - Analysis</h2>
                    {reviews.length > 0 ? (
                        <PracticeAnalysis analysisResults={aggregatedResults} />
                    ) : (
                        <p className="text-center text-gray-600">No reviews found for this practice.</p>
                    )}
                </main>
            </div>
        </div>
    );
}
