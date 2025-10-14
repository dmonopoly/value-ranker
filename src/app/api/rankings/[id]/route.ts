import { NextResponse } from 'next/server';
import clientPromise from '@/services/mongodb';
import { ObjectId } from 'mongodb'; // Required to query by MongoDB's unique _id

/**
 * Handles GET requests to fetch a single ranking by its ID.
 * Example URL: /api/rankings/60d21b4667d0d8992e610c85
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGO_DATABASE);
        const { id } = params;

        // Validate the incoming ID to ensure it's a valid MongoDB ObjectId.
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid ranking ID format.' }, { status: 400 });
        }

        // Find the single document in the database that matches the ID.
        const ranking = await db
            .collection(process.env.MONGO_RANKINGS_COLLECTION!)
            .findOne({ _id: new ObjectId(id) });

        if (!ranking) {
            return NextResponse.json({ message: 'Ranking not found.' }, { status: 404 });
        }

        return NextResponse.json(ranking, { status: 200 });

    } catch (e) {
        console.error("Failed to fetch ranking:", e);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Handles PUT requests to update an existing ranking by its ID.
 * Example URL: /api/rankings/60d21b4667d0d8992e610c85
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGO_DATABASE);
        const { id } = params;

        // Validate the ID format.
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid ranking ID format.' }, { status: 400 });
        }

        const updatedData = await request.json();

        // It's good practice to remove the _id from the update payload
        // to prevent accidentally trying to change the immutable _id field.
        delete updatedData._id;

        // Find the document by ID and update it with the new data.
        // The `$set` operator replaces the values of the fields with the specified values.
        const result = await db
            .collection(process.env.MONGO_RANKINGS_COLLECTION!)
            .updateOne({ _id: new ObjectId(id) }, { $set: updatedData });

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: 'Ranking not found to update.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Ranking updated successfully.' }, { status: 200 });

    } catch (e) {
        console.error("Failed to update ranking:", e);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}