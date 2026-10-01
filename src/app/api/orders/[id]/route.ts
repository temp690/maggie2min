import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, getSettings } from '@/lib/db';
import { buildCustomerStatusUpdateUrl } from '@/lib/utils';
import { OrderStatus, PaymentStatus } from '@/lib/types';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const order = getOrderById(id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const settings = getSettings();

    return NextResponse.json({
      success: true,
      order,
      storePhone: settings.adminPhone,
      pickupLocation: settings.pickupLocation,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const authHeader = request.headers.get('x-admin-pin');
    const settings = getSettings();

    if (authHeader !== settings.adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    const body = await request.json();
    const { status, paymentStatus } = body;

    const validStatuses: OrderStatus[] = ['received', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updated = updateOrderStatus(id, status as OrderStatus, paymentStatus as PaymentStatus);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const studentWhatsAppUrl = buildCustomerStatusUpdateUrl(updated.phoneNumber, updated);

    return NextResponse.json({
      success: true,
      order: updated,
      studentWhatsAppUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
