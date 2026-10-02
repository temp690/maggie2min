import { Order } from './types';

export function formatINR(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/**
 * Generates an official UPI deep link:
 * upi://pay?pa=upiId&pn=PayeeName&am=amount&tn=Note&cu=INR
 */
export function generateUPILink(upiId: string, payeeName: string, amount: number, orderId: string): string {
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(payeeName.trim());
  const note = encodeURIComponent(`Hostel Order ${orderId}`);
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${amount.toFixed(2)}&tn=${note}&cu=INR`;
}

/**
 * Builds WhatsApp message string for the Admin when a student places an order.
 */
export function buildAdminWhatsAppMessage(order: Order, hostelName: string): string {
  const itemsText = order.items
    .map((item, idx) => {
      const addons = item.selectedAddons.length > 0
        ? ` (${item.selectedAddons.map(a => a.name).join(', ')})`
        : '';
      return `${idx + 1}. *${item.name}* x${item.quantity}${addons} - ₹${item.itemTotalPrice}`;
    })
    .join('\n');

  const deliveryNote = `🚪 *Room Delivery* to *${order.roomNumber}*`;

  const prefNote = order.notes ? `\n📝 *Notes:* ${order.notes}` : '';

  const msg = `🚨 *NEW MIDNIGHT ORDER #${order.id}*
------------------------------
👤 *Student:* ${order.customerName}
📍 *Location:* ${deliveryNote}
📞 *Phone:* ${order.phoneNumber}
${prefNote}
------------------------------
🍽️ *Items:*
${itemsText}

💰 *Total Amount:* *₹${order.total}*
💳 *Payment:* Pay at Room Door (Cash / UPI on Delivery)
⏰ *Time:* ${formatTimestamp(order.createdAt)}
------------------------------
_Hostel Midnight Snack Delivery_`;

  return encodeURIComponent(msg);
}

/**
 * Builds WhatsApp link to send notification directly to Admin's phone.
 */
export function getAdminWhatsAppUrl(adminPhone: string, order: Order, hostelName: string): string {
  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
  const encodedMsg = buildAdminWhatsAppMessage(order, hostelName);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

/**
 * Builds WhatsApp message from Admin to Student with live update.
 */
export function buildCustomerStatusUpdateUrl(studentPhone: string, order: Order): string {
  const cleanPhone = studentPhone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let statusMsg = '';
  switch (order.status) {
    case 'received':
      statusMsg = `Hey ${order.customerName}, we received your midnight order #${order.id}! We are getting it ready.`;
      break;
    case 'preparing':
      statusMsg = `Hey ${order.customerName}! 🍳 Your Maggi is hot and sizzling on the kettle for order #${order.id}. Wrapping it up soon!`;
      break;
    case 'on_the_way':
      statusMsg = `Hey ${order.customerName}! 🏃‍♂️ Your midnight fuel for order #${order.id} is ON THE WAY to Room ${order.roomNumber}! Keep your phone handy.`;
      break;
    case 'delivered':
      statusMsg = `Order #${order.id} has ARRIVED at Room ${order.roomNumber}! 🍜 Enjoy your late-night snack and good luck with your studies!`;
      break;
    case 'cancelled':
      statusMsg = `Notice for Order #${order.id}: This order has been cancelled. Please contact kitchen admin if you have questions.`;
      break;
  }

  const encoded = encodeURIComponent(statusMsg);
  return `https://wa.me/${formattedPhone}?text=${encoded}`;
}
