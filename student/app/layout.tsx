import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student App',
  description: 'Aidutech Student Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
