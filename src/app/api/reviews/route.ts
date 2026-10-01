import { NextResponse } from 'next/server';
import { getReviews, addReview } from '@/lib/db';

export async function GET() {
  try {
    const reviews = getReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, customerName, roomNumber, rating, comment } = body;

    if (!comment || typeof comment !== 'string' || comment.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Please enter your review feedback.' }, { status: 400 });
    }

    const numRating = Number(rating) || 5;
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5 stars.' }, { status: 400 });
    }

    const review = addReview({
      orderId: (orderId || '').trim() || undefined,
      customerName: (customerName || '').trim() || 'Hostel Mate',
      roomNumber: (roomNumber || '').trim() || undefined,
      rating: numRating,
      comment: comment.trim(),
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
