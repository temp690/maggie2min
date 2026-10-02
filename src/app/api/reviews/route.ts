import { NextResponse } from 'next/server';
import { getReviews, addReview, updateReview, deleteReview, getSettings } from '@/lib/db';

export async function GET() {
  try {
    const reviews = await getReviews();
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

    const review = await addReview({
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('x-admin-pin');
    const settings = await getSettings();

    if (authHeader !== settings.adminPin && body.adminPin !== settings.adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    const { id, customerName, roomNumber, rating, comment } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Review id is required' }, { status: 400 });
    }

    const updates: any = {};
    if (customerName !== undefined) updates.customerName = String(customerName).trim();
    if (roomNumber !== undefined) updates.roomNumber = String(roomNumber).trim();
    if (rating !== undefined) updates.rating = Number(rating);
    if (comment !== undefined) updates.comment = String(comment).trim();

    const updated = await updateReview(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const authHeader = request.headers.get('x-admin-pin') || searchParams.get('adminPin');
    const settings = await getSettings();

    if (authHeader !== settings.adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id parameter is required' }, { status: 400 });
    }

    const deleted = await deleteReview(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
