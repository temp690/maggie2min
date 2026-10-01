// End-to-end API & business logic test runner for Maggi, Pasta, Verification, Reviews & Suggestions
import { spawn } from 'child_process';

const PORT = 3060;
process.env.PORT = String(PORT);

console.log('🚀 Starting Next.js test server on port ' + PORT + '...');

const serverProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const url = `http://127.0.0.1:${PORT}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/settings`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (_) {}
    await sleep(500);
  }

  if (!ready) {
    console.error('❌ Server failed to start within timeout.');
    serverProcess.kill();
    process.exit(1);
  }

  console.log('✅ Server ready. Running automated verification tests...\n');
  let failures = 0;

  // TEST 1: Settings API
  try {
    const { data } = await request('/api/settings');
    if (data.success && data.settings.storeName === "Crave O'Clock" && data.settings.deliveryFee === 0 && data.settings.isOpen) {
      console.log('✅ Test 1 Passed: Settings API returns correct defaults (Crave O\'Clock, deliveryFee = ₹0, kitchen open).');
    } else {
      console.error('❌ Test 1 Failed:', data);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 1 Error:', e);
    failures++;
  }

  // TEST 2: Menu Overhaul (Plain Maggi ₹30, Cheese Maggi ₹45, Schezwan Maggi ₹40, Pasta ₹50, and NO cheese on Schezwan)
  try {
    const { data } = await request('/api/menu');
    const categories = data.categories || [];
    const maggiCat = categories.find((c) => c.id === 'maggi');
    const pastaCat = categories.find((c) => c.id === 'pasta');

    const plain = maggiCat?.items?.find((i) => i.id === 'item-plain-maggi');
    const cheese = maggiCat?.items?.find((i) => i.id === 'item-cheese-maggi');
    const schezwan = maggiCat?.items?.find((i) => i.id === 'item-schezwan-maggi');
    const pasta = pastaCat?.items?.find((i) => i.id === 'item-midnight-pasta');

    const plainOk = plain && plain.basePrice === 30 && plain.addons.some((a) => a.price === 4) && plain.addons.some((a) => a.price === 3);
    const cheeseOk = cheese && cheese.basePrice === 45 && cheese.addons.some((a) => a.name.includes('Schezwan') && a.price === 5);
    // Schezwan Maggi must NOT have melted cheese slice addon
    const schezwanHasCheese = schezwan?.addons?.some((a) => a.name.toLowerCase().includes('cheese'));
    const schezwanOk = schezwan && schezwan.basePrice === 40 && !schezwanHasCheese;
    const pastaOk = pasta && pasta.basePrice === 50 && pasta.addons.some((a) => a.name.includes('Cheese') && a.price === 10) && pasta.addons.some((a) => a.name.includes('Flakes') && a.price === 5);

    if (plainOk && cheeseOk && schezwanOk && pastaOk) {
      console.log('✅ Test 2 Passed: Menu correctly configured with Plain Maggi (₹30), Cheese Maggi (₹45), Schezwan Maggi (₹40 without cheese slice), and Pasta (₹50).');
    } else {
      console.error('❌ Test 2 Failed:', { plain, cheese, schezwan, pasta, schezwanHasCheese });
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 2 Error:', e);
    failures++;
  }

  // TEST 3: Place Order with Server Price Recalculation & FREE Room Delivery
  let testOrderId = '';
  try {
    const orderPayload = {
      customerName: 'Siddharth Roy',
      roomNumber: 'BH-2 Room 318',
      phoneNumber: '9876543210',
      notes: 'Please do not knock, call on arrival',
      deliveryType: 'room',
      items: [
        {
          menuItemId: 'item-plain-maggi',
          quantity: 1,
          selectedAddons: [
            { id: 'addon-flakes-4', price: 4, name: 'Oregano & Chili Flakes' },
            { id: 'addon-masala-3', price: 3, name: 'Extra Magic Masala' },
          ],
        },
        {
          menuItemId: 'item-cheese-maggi',
          quantity: 1,
          selectedAddons: [
            { id: 'addon-schezwan-5', price: 5, name: 'Schezwan Sauce Toss' },
          ],
        },
      ],
      paymentMethod: 'upi',
      paymentRef: 'UPI-REF-998877',
    };

    // Expected:
    // Item 1: Plain (₹30) + Flakes (₹4) + Masala (₹3) = ₹37.
    // Item 2: Cheese (₹45) + Schezwan (₹5) = ₹50.
    // Subtotal: ₹87.
    // Room Delivery: ₹0 (FREE).
    // Grand Total: ₹87.

    const { data } = await request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (data.success && data.order) {
      testOrderId = data.order.id;
      const order = data.order;
      const priceOk = order.subtotal === 87 && order.deliveryFee === 0 && order.total === 87;
      const verificationOk = order.paymentStatus === 'pending_verification';

      if (priceOk && verificationOk) {
        console.log(`✅ Test 3 Passed: Order ${testOrderId} placed with exact calculated price (₹87 + ₹0 FREE Delivery = ₹87) and status set to 'pending_verification'.`);
      } else {
        console.error('❌ Test 3 Pricing / Verification mismatch:', order);
        failures++;
      }
    } else {
      console.error('❌ Test 3 Failed to create order:', data);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 3 Error:', e);
    failures++;
  }

  // TEST 4: Live Order Status Tracking
  try {
    const { data } = await request(`/api/orders/${testOrderId}`);
    if (data.success && data.order && data.order.paymentStatus === 'pending_verification') {
      console.log(`✅ Test 4 Passed: Live customer order tracker reflects order ${testOrderId} awaiting verification.`);
    } else {
      console.error('❌ Test 4 Failed:', data);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 4 Error:', e);
    failures++;
  }

  // TEST 5: Admin 1-Click Verification & Status Stepper
  try {
    const adminPin = 'hostel123';
    // Admin verifies payment
    const verifyRes = await request(`/api/orders/${testOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
      body: JSON.stringify({ status: 'preparing', paymentStatus: 'paid' }),
    });

    const isVerified =
      verifyRes.data.order?.paymentStatus === 'paid' &&
      verifyRes.data.order?.status === 'preparing';

    if (isVerified) {
      console.log(`✅ Test 5 Passed: Admin 1-click verification approved payment for ${testOrderId} and initiated cooking.`);
    } else {
      console.error('❌ Test 5 Verification failed:', verifyRes);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 5 Error:', e);
    failures++;
  }

  // TEST 6: Visual Menu & Price Editor
  try {
    const adminPin = 'hostel123';
    // Update Plain Maggi to 32
    const updateRes = await request('/api/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
      body: JSON.stringify({ itemId: 'item-plain-maggi', basePrice: 32 }),
    });

    const { data: menuAfter } = await request('/api/menu');
    const plainAfter = menuAfter.categories
      ?.find((c) => c.id === 'maggi')
      ?.items?.find((i) => i.id === 'item-plain-maggi');

    if (plainAfter?.basePrice === 32) {
      console.log('✅ Test 6 Passed: Visual Menu Editor successfully updated price of Plain Maggi to ₹32.');
    } else {
      console.error('❌ Test 6 Price update failed:', plainAfter);
      failures++;
    }

    // Revert back to 30
    await request('/api/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
      body: JSON.stringify({ itemId: 'item-plain-maggi', basePrice: 30 }),
    });
  } catch (e) {
    console.error('❌ Test 6 Error:', e);
    failures++;
  }

  // TEST 7: Customer Reviews API
  try {
    const revRes = await request('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Ankit Sharma',
        roomNumber: 'BH-2 Room 201',
        rating: 5,
        comment: 'Cheese Maggi is delicious and piping hot!',
      }),
    });

    const { data: allRevs } = await request('/api/reviews');
    const hasMyRev = allRevs.reviews?.some((r) => r.customerName === 'Ankit Sharma');

    if (revRes.ok && hasMyRev) {
      console.log('✅ Test 7 Passed: Customer review submission and reviews feed working flawlessly.');
    } else {
      console.error('❌ Test 7 Review failed:', revRes);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 7 Error:', e);
    failures++;
  }

  // TEST 8: Dish Suggestion & Voting Poll API
  try {
    const sugRes = await request('/api/suggestions');
    const firstSug = sugRes.data.suggestions?.[0];
    const initialVotes = firstSug?.votes || 0;

    const voteRes = await request('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId: firstSug.id }),
    });

    if (voteRes.data.suggestion?.votes === initialVotes + 1) {
      console.log(`✅ Test 8 Passed: Dish suggestion vote recorded (${firstSug.title}: ${initialVotes + 1} votes).`);
    } else {
      console.error('❌ Test 8 Vote failed:', voteRes);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 8 Error:', e);
    failures++;
  }

  // TEST 9: Admin Dish Suggestion Editing & Deletion API
  try {
    const adminPin = 'hostel123';
    // 1. Create a test suggestion
    const createRes = await request('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Butter Bun Maska',
        description: 'Warm bun toasted with rich Amul butter',
        icon: '🍞',
        suggestedBy: 'Test Runner',
      }),
    });
    const createdId = createRes.data.suggestion?.id;

    // 2. Edit suggestion (PATCH)
    const patchRes = await request('/api/suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
      body: JSON.stringify({
        id: createdId,
        title: 'Super Butter Bun Maska',
        description: 'Toasted bun with double butter',
        icon: '🧈',
        votes: 12,
      }),
    });
    const patchOk = patchRes.ok && patchRes.data.suggestion?.title === 'Super Butter Bun Maska' && patchRes.data.suggestion?.votes === 12;

    // 3. Delete suggestion (DELETE)
    const deleteRes = await request(`/api/suggestions?id=${createdId}&adminPin=${adminPin}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': adminPin },
    });
    const deleteOk = deleteRes.ok && deleteRes.data.success;

    if (patchOk && deleteOk) {
      console.log('✅ Test 9 Passed: Admin suggestion editing (PATCH) and deletion (DELETE) verified successfully.');
    } else {
      console.error('❌ Test 9 Suggestion edit/delete failed:', { patchRes, deleteRes });
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 9 Error:', e);
    failures++;
  }

  console.log('\n----------------------------------------');
  if (failures === 0) {
    console.log('🎉 ALL 9 TEST SUITES PASSED FLAWLESSLY!');
  } else {
    console.error(`💥 ${failures} TEST(S) FAILED.`);
  }
  console.log('----------------------------------------\n');

  serverProcess.kill();
  process.exit(failures === 0 ? 0 : 1);
}

runTests();
