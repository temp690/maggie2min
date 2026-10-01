import { NextResponse } from 'next/server';
import { getMenu, updateMenuItem, getSettings } from '@/lib/db';

export async function GET() {
  try {
    const data = getMenu();
    return NextResponse.json({ success: true, ...data });
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

    const { itemId, available, basePrice, name } = body;
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId is required' }, { status: 400 });
    }

    const updates: any = {};
    if (typeof available === 'boolean') updates.available = available;
    if (basePrice !== undefined && !isNaN(Number(basePrice))) updates.basePrice = Number(basePrice);
    if (name && typeof name === 'string') updates.name = name.trim();

    const updated = updateMenuItem(itemId, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
