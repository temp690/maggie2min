import { NextResponse } from 'next/server';
import { getSettings, updateSettings, checkIsStoreOpen } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    const openCheck = checkIsStoreOpen(settings);

    // Public view: hide sensitive admin PIN and webhook
    const publicSettings = {
      storeName: settings.storeName,
      tagline: settings.tagline,
      hostelName: settings.hostelName,
      pickupLocation: settings.pickupLocation,
      adminPhone: settings.adminPhone,
      upiId: settings.upiId,
      upiName: settings.upiName,
      deliveryFee: settings.deliveryFee,
      currentDay: settings.currentDay,
      phase: settings.phase,
      isOpen: openCheck.isOpen,
      closedReason: openCheck.reason || null,
      storeSchedule: settings.storeSchedule,
      statusOverride: settings.statusOverride,
      emergencyControls: settings.emergencyControls,
    };

    return NextResponse.json({ success: true, settings: publicSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('x-admin-pin');
    const currentSettings = await getSettings();

    // Verify PIN
    if (authHeader !== currentSettings.adminPin && body.adminPin !== currentSettings.adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    const { adminPin: _, ...updates } = body;
    const updated = await updateSettings(updates);

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
