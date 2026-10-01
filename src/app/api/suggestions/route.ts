import { NextResponse } from 'next/server';
import { getSuggestions, voteSuggestion, addCustomSuggestion, updateSuggestion, deleteSuggestion, getSettings } from '@/lib/db';

export async function GET() {
  try {
    const suggestions = getSuggestions();
    // sort by votes descending
    suggestions.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { suggestionId, title, suggestedBy, icon, description } = body;

    // Upvote existing suggestion (student action)
    if (suggestionId) {
      const updated = voteSuggestion(suggestionId);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Suggestion not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, suggestion: updated });
    }

    // Submit new dish idea
    if (title && typeof title === 'string' && title.trim().length > 2) {
      const created = addCustomSuggestion(title.trim(), suggestedBy, icon, description);
      return NextResponse.json({ success: true, suggestion: created });
    }

    return NextResponse.json({ success: false, error: 'Invalid suggestion submission' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('x-admin-pin');
    const settings = getSettings();

    if (authHeader !== settings.adminPin && body.adminPin !== settings.adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    const { id, title, description, icon, votes } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const updated = updateSuggestion(id, { title, description, icon, votes });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Suggestion not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, suggestion: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const authHeader = request.headers.get('x-admin-pin') || searchParams.get('adminPin');
    const settings = getSettings();

    if (authHeader !== settings.adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id parameter is required' }, { status: 400 });
    }

    const deleted = deleteSuggestion(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Suggestion not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Suggestion deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
