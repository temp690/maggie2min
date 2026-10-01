# 🍜 HostelNightBites — College Hostel Midnight Snack Delivery

A modern, mobile-first, minimalist e-commerce web application specifically engineered for an 8-day college hostel midnight snack pop-up delivery business.

Built with **Next.js (App Router)**, **React**, **Tailwind CSS**, and zero-native-compilation atomic file storage.

---

## ⚡ Quick Start

```bash
# Navigate to the project directory
cd /home/pixel/.gemini/antigravity/scratch/hostel-midnight-snacks

# Start the development server
npm run dev

# Or build and launch production server
npm run build
npm start
```
The application will be live at `http://localhost:3000`.

---

## 🌟 Key Features

### 1. 📱 User Storefront (Mobile-First UI)
- **Late-Night Midnight Aesthetic**: Dark slate theme with glowing amber accents, optimized for dimly lit hostel rooms and 1-hand mobile browsing.
- **Phased Menu Rollout**:
  - **Days 1–2 (Maggi Only)**:
    - **Classic Midnight Maggi** (₹30)
    - **Double Trouble 2x Maggi** (₹55)
    - **Add-on Customizer Drawer**:
      - 🌶️ *Schezwan Sauce Toss* (+₹5)
      - 🧀 *Cheese Blast Slice* (+₹5)
      - 🧈 *Amul Butter Tadka* (+₹10)
      - 🌿 *Oregano Herbs* (FREE)
      - 🔥 *Crushed Chili Flakes* (FREE)
  - **Day 3+ Rollout (Chips & Drinks)**:
    - *Chips & Munchies*: Lay's Magic Masala (₹20), Kurkure (₹20), Doritos Nachos (₹30).
    - *Midnight Sips*: Sting Energy (₹20), Thums Up (₹35), Chilled Frappe Cold Coffee (₹40).
    - Admin can unlock Phase 2 with a single toggle or individually mark items in/out of stock.
- **Delivery Mode & Pricing**:
  - 🚪 **Hostel Room Delivery**: Automatically adds **+₹3** delivery fee.
  - 🏃 **Hostel Pickup**: FREE (₹0).
- **Checkout**:
  - Fields: Student Full Name, Hostel Block & Room Number, WhatsApp Phone (10 digits), and Optional Cooking/Delivery Notes.
- **Online UPI & Payment**:
  - Live dynamic UPI QR code generator (`upi://pay?pa=...&am=...&tn=...`) compatible with Google Pay, PhonePe, and Paytm.
  - Mobile "Open Installed UPI App" intent link.
  - Optional UTR reference input.
  - Quick Mock / Cash-at-Door option for rapid testing.

---

### 2. 📡 Live Order Status Tracker (`/order/:id`)
- Real-time order tracking with 4-stage visual stepper:
  1. 📋 **Order Received** (Kitchen verified the order)
  2. 🍳 **Preparing in Kitchen** (Water boiling, Maggi & spices simmering)
  3. 🏃‍♂️ **On the Way to Room** (Runner climbing the stairs)
  4. 🚪 **Arrived at Door** (Snack delivered!)
- Auto-polls every 4 seconds to sync status changes made by the admin in real-time.
- One-click **"Chat with Kitchen on WhatsApp"** button pre-filled with order ID and room details.
- Header order search modal accessible anywhere on the storefront.

---

### 3. 🛡️ Admin Control Panel (`/admin`)
- **Security**: Protected by PIN (default: `hostel123`, customizable in Settings).
- **Store Hours & Schedule Timer**:
  - Configure open/close times (e.g., `22:00` to `04:00`). Handles overnight midnight crossover.
  - Toggle between automated schedule or manual "Open Now" / "Close Now".
- **Emergency Pause & Delay Controls**:
  - **Emergency Pause Toggle**: Disables checkout immediately when stock runs out, displaying a custom message banner (e.g., *"Boiling water for the next batch, back in 15 mins 🍳"*).
  - **High-Demand Rush Banner**: Displays a glowing fire banner (e.g., *"🔥 High demand rush! Maggi prep time is currently ~20-25 mins"*).
- **Live Kitchen Order Management**:
  - **Audio Chime**: Plays a pleasant audio chime when a new order arrives.
  - **One-Click Progression**:
    - `[1-Click: Start Cooking 🍳]` ➔ `[1-Click: Send Runner 🏃‍♂️]` ➔ `[1-Click: Mark Delivered & Paid 🚪]`.
  - **Instant WhatsApp Link**: 1-click button on each order card to send personalized status updates directly to the student's WhatsApp number.
  - **Nightly Revenue Counter**: Displays active orders, total orders, and total revenue ₹.
- **8-Day Phased Menu Manager**:
  - Switch between Day 1–2 (Maggi) and Day 3+ (Full Menu).
  - 1-click "In Stock" / "Sold Out" buttons for any individual item.

---

### 4. 📲 WhatsApp Order Notification Flow
When an order is submitted:
1. The student is presented with a **"Notify Kitchen on WhatsApp (Instant)"** button (`https://wa.me/<admin_phone>?text=...`).
2. The message is pre-formatted with:
   - Order ID (`#HNB-1001`)
   - Student Name & Room Number
   - Exact Items & selected Add-ons (e.g. *Schezwan + Cheese*)
   - Total Bill Amount
   - Payment method (UPI / Cash)
3. The Admin can also click the WhatsApp icon beside any order card to send instant status updates ("Your Maggi is ready and heading to Room 312!").

---

## 📁 Project Directory Structure

```
hostel-midnight-snacks/
├── data/
│   ├── menu.json             # Phased menu items & add-on configurations
│   ├── orders.json           # Live atomic orders database
│   └── settings.json         # Operating hours, pause state, UPI ID, admin PIN
├── src/
│   ├── app/
│   │   ├── admin/page.tsx    # Admin Control Center (PIN protected)
│   │   ├── api/
│   │   │   ├── menu/route.ts       # Menu catalog API & stock toggle
│   │   │   ├── orders/route.ts     # Create order & list orders
│   │   │   ├── orders/[id]/route.ts# Order detail & status progression
│   │   │   └── settings/route.ts   # Store timer, pause, and delay banners
│   │   ├── order/[id]/page.tsx# Customer live tracking page
│   │   ├── globals.css       # Tailwind & custom scrollbar styles
│   │   ├── layout.tsx        # Mobile viewport & metadata layout
│   │   └── page.tsx          # Mobile-first customer storefront
│   ├── components/
│   │   ├── AddonSelectorModal.tsx # Maggi customizer (Schezwan, Cheese, Flakes)
│   │   ├── AlertBanners.tsx  # Pause banner, high-demand rush banner
│   │   ├── CartDrawer.tsx    # Slide-over cart & Room Delivery fee toggle
│   │   ├── CartFloatingBar.tsx # Sticky mobile bottom cart pill
│   │   ├── CheckoutModal.tsx # Name, room, phone, and dynamic UPI QR
│   │   ├── ItemCard.tsx      # Snack card with customization trigger
│   │   ├── Navbar.tsx        # Header with live kitchen status & order search
│   │   ├── StatusStepper.tsx # 4-stage tracking progress stepper
│   │   └── TrackOrderModal.tsx # Quick Order ID lookup modal
│   └── lib/
│       ├── db.ts             # Safe atomic file database (menu, orders, settings)
│       ├── types.ts          # Complete TypeScript domain interfaces
│       └── utils.ts          # UPI deep links, WhatsApp messages, INR formatters
├── tests/
│   └── verify-api.mjs        # Automated end-to-end integration test suite
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🔒 Security & Data Integrity

- **Server-Side Price Calculation**: Client cannot manipulate add-on or base prices in HTTP payloads; the server looks up item definitions directly in `menu.json` and calculates the total independently.
- **Input Validation**: Sanitizes room numbers, student names, and strictly verifies 10-digit Indian phone numbers.
- **Admin PIN Protection**: Admin routes require the `x-admin-pin` header matching `settings.json`.
- **Atomic File Database**: Zero native C++ compilation dependencies. Orders and settings use atomic rename file writes (`.tmp` ➔ `target`) preventing data loss or partial writes during midnight surges.

---

## 🚀 Deployment Instructions

### Option 1: Share across Hostel Wi-Fi (Local Network)
If you are running the kitchen from your hostel laptop:
1. Connect your laptop to the hostel Wi-Fi.
2. Find your local IP address:
   ```bash
   # Linux / macOS
   ip addr show | grep inet
   # Windows
   ipconfig
   ```
3. Run the app listening on all interfaces:
   ```bash
   npm run build
   npx next start -H 0.0.0.0 -p 3000
   ```
4. Share the URL with hostel wingmates: `http://192.168.1.X:3000` (or generate a QR code for your door poster!).

### Option 2: Deploy to Vercel (Recommended for 1-Click Free Hosting)
1. Push this folder to a GitHub repository.
2. Import the repository in [Vercel](https://vercel.com).
3. Framework preset: **Next.js**.
4. Click **Deploy**. Your storefront will be live on a `*.vercel.app` URL with SSL!

### Option 3: Deploy to Render / Railway / DigitalOcean VPS
```bash
npm install
npm run build
npm start
```
Configure environment variables if needed (`PORT=3000`).

---

## 🧪 Testing

Run the automated test suite anytime to verify all 7 end-to-end user flows:
```bash
node tests/verify-api.mjs
```
