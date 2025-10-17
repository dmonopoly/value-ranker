import { NextResponse } from 'next/server';
import clientPromise from '@/services/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  console.log("POST /api/rankings called");
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DATABASE);

    const rankingId = new ObjectId();
    const rankingData = await request.json();
    rankingData._id = rankingId;

    const result = await db.collection(process.env.MONGO_RANKINGS_COLLECTION!).insertOne(rankingData);

    return NextResponse.json({ insertedId: result.insertedId }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to create ranking.' }, { status: 500 });
  }
}