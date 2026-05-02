import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aidutech — AI-Powered Learning',
  description: 'Your AI-powered learning journey awaits. Select your role to begin.',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23722ed1"/><path d="M30 70 L50 30 L70 70 M38 55 L62 55" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
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
