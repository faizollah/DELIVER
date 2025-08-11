'use server';

import axios from 'axios';
import prisma from '@/lib/prisma';
import {
  Practice,
  PracticeDetails,
  SentimentResult,
  MultilabelResult,
  AnalysisResults,
  SentimentBatchResult,
  MultilabelBatchResult,
  Review
} from '@/lib/types';

export async function searchPractices(query: string): Promise<Practice[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
  const params = {
    query: `dental practice ${query}`,
    key: process.env.GOOGLE_PLACES_API_KEY,
    type: 'dentist',
    language: 'en',
  };
  const response = await axios.get(url, { params });
  return response.data.results.map((p: Practice) => ({
    place_id: p.place_id,
    name: p.name,
    address: p.formatted_address,
    rating: p.rating,
    user_ratings_total: p.user_ratings_total,
  }));
}

export async function getPracticeDetails(place_id: string): Promise<PracticeDetails> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`;
  const params = {
    place_id,
    fields: 'name,formatted_address,reviews',
    key: process.env.GOOGLE_PLACES_API_KEY,
    language: 'en'
  };
  const response = await axios.get(url, { params });
  return response.data.result;
}

export async function analyzeSingleReview(text: string): Promise<AnalysisResults> {
  const sentimentResult = await callModelbitApi<SentimentResult>(process.env.SENTIMENT_DEPLOYMENT_NAME!, text);
  const multilabelResult = await callModelbitApi<MultilabelResult>(process.env.MULTILABEL_DEPLOYMENT_NAME!, text);

  await prisma.sentimentLog.create({
    data: {
      inputText: text,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
    }
  });

  return { sentimentResult, multilabelResult };
}

async function callModelbitApi<T>(deploymentName: string, text: string): Promise<T> {
  const url = `https://${process.env.MODELBIT_WORKSPACE}.${process.env.MODELBIT_REGION}.modelbit.com/v1/${deploymentName}/latest`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Modelbit-Api-Key': process.env.MODELBIT_API_KEY,
  };
  const body = {
    data: [[1, text]],
  };
  const response = await axios.post(url, body, { headers });
  return response.data.data[0][1];
}

export async function analyzePracticeReviews(reviews: Review[]): Promise<{
  sentimentBatchResults: SentimentBatchResult;
  multilabelBatchResults: MultilabelBatchResult;
}> {
  const batchData = reviews.map((review, i) => [i, review.text]);
  const sentimentBatchResults = await callModelbitBatchApi<SentimentBatchResult>(process.env.SENTIMENT_DEPLOYMENT_NAME!, batchData);
  const multilabelBatchResults = await callModelbitBatchApi<MultilabelBatchResult>(process.env.MULTILABEL_DEPLOYMENT_NAME!, batchData);

  return { sentimentBatchResults, multilabelBatchResults };
}

async function callModelbitBatchApi<T>(deploymentName: string, batchData: (string | number)[][]): Promise<T> {
  const url = `https://${process.env.MODELBIT_WORKSPACE}.${process.env.MODELBIT_REGION}.modelbit.com/v1/${deploymentName}/latest`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Modelbit-Api-Key': process.env.MODELBIT_API_KEY,
  };
  const body = {
    data: batchData,
  };
  const response = await axios.post(url, body, { headers });
  return response.data.data;
}
