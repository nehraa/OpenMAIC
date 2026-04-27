import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aidutech — Choose Your Path',
  description: 'Select your role to access Aidutech platform',
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
