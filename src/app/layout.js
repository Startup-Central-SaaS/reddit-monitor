import './globals.css';

export const metadata = {
  title: 'WorkCentral Reddit Monitor',
  description: 'Monitor Reddit for WorkCentral-relevant conversations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-200 min-h-screen">{children}</body>
    </html>
  );
}
