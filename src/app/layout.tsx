import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Crave O'Clock | Hostel Midnight Food Delivery",
  description: 'Hot 2-minute Maggi and fresh pasta delivered straight to your hostel room door for free.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍜</text></svg>',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0d1321',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-midnight-950 text-slate-100 min-h-screen selection:bg-amber-500 selection:text-slate-900 pb-16 md:pb-6">
        {children}
      </body>
    </html>
  );
}
