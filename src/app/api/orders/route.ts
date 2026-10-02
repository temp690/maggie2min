import { NextResponse } from 'next/server';
import { getOrders, createOrder, getSettings, checkIsStoreOpen, getMenu } from '@/lib/db';
import { getAdminWhatsAppUrl } from '@/lib/utils';
import { OrderItem } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-pin');
    const settings = await getSettings();

    // Verify admin access
    if (authHeader !== settings.adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    const orders = await getOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const settings = await getSettings();
    const storeCheck = checkIsStoreOpen(settings);

    // 1. Check store open
    if (!storeCheck.isOpen) {
      return NextResponse.json(
        { success: false, error: storeCheck.reason || 'Store is currently closed.' },
        { status: 400 }
      );
    }

    // 2. Check store paused
    if (settings.emergencyControls.isPaused) {
      return NextResponse.json(
        {
          success: false,
          error: settings.emergencyControls.pauseMessage || 'Orders are temporarily paused. Please try again soon!',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { customerName, roomNumber, phoneNumber, notes, deliveryType, items, paymentMethod, paymentRef } = body;

    // 3. Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Please enter your student name.' }, { status: 400 });
    }

    if (!roomNumber || typeof roomNumber !== 'string' || roomNumber.trim().length < 1) {
      return NextResponse.json({ success: false, error: 'Please enter your hostel room number.' }, { status: 400 });
    }

    const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit WhatsApp number.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your cart is empty!' }, { status: 400 });
    }

    // 4. Server-Side Price Verification (Tamper-Proof)
    const { categories } = await getMenu();
    const allMenuItems = categories.flatMap((c) => c.items);

    let calculatedSubtotal = 0;
    const verifiedItems: OrderItem[] = [];

    for (const rawItem of items) {
      const menuItem = allMenuItems.find((m) => m.id === rawItem.menuItemId);
      if (!menuItem) {
        return NextResponse.json({ success: false, error: `Invalid item selected: ${rawItem.name}` }, { status: 400 });
      }

      if (!menuItem.available) {
        return NextResponse.json({ success: false, error: `Item "${menuItem.name}" is currently sold out!` }, { status: 400 });
      }

      const selectedAddons: any[] = [];
      let itemAddonTotal = 0;

      if (Array.isArray(rawItem.selectedAddons) && menuItem.addons) {
        for (const rawAddon of rawItem.selectedAddons) {
          const matchedAddon = menuItem.addons.find((a) => a.id === rawAddon.id);
          if (matchedAddon) {
            selectedAddons.push({
              id: matchedAddon.id,
              name: matchedAddon.name,
              price: matchedAddon.price,
              type: matchedAddon.type,
              icon: matchedAddon.icon,
            });
            itemAddonTotal += matchedAddon.price;
          }
        }
      }

      const singleItemPrice = menuItem.basePrice + itemAddonTotal;
      const quantity = Math.max(1, parseInt(rawItem.quantity, 10) || 1);
      const totalItemPrice = singleItemPrice * quantity;

      calculatedSubtotal += totalItemPrice;

      verifiedItems.push({
        id: rawItem.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        basePrice: menuItem.basePrice,
        selectedAddons,
        quantity,
        itemTotalPrice: totalItemPrice,
      });
    }

    // 5. Delivery Fee (Room Delivery Only)
    const isRoomDelivery = true;
    const deliveryFee = typeof settings.deliveryFee === 'number' ? settings.deliveryFee : 0;
    const grandTotal = calculatedSubtotal + deliveryFee;

    // 6. Payment Status handling
    // Payment is made upon room delivery (Cash / UPI) -> mark as 'cod_verified'
    let paymentStatus: any = 'cod_verified';
    if (paymentMethod === 'mock_paid') {
      paymentStatus = 'paid';
    } else if (paymentMethod === 'upi') {
      paymentStatus = 'pending_verification';
    }

    // 7. Create Order
    const newOrder = await createOrder({
      customerName: customerName.trim(),
      roomNumber: roomNumber.trim(),
      phoneNumber: cleanPhone,
      notes: (notes || '').trim(),
      deliveryType: 'room',
      deliveryFee,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      total: grandTotal,
      status: 'received',
      paymentStatus,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      paymentRef: paymentRef ? paymentRef.trim() : undefined,
    });

    // 8. Generate WhatsApp alert link for Admin
    const adminWhatsAppUrl = getAdminWhatsAppUrl(settings.adminPhone, newOrder, settings.hostelName);

    return NextResponse.json({
      success: true,
      order: newOrder,
      adminWhatsAppUrl,
      trackingUrl: `/order/${newOrder.id}`,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
