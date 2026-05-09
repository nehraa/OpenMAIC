import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIDU - Your AI Classroom, Anywhere',
  description: 'Turn any topic into a live lesson with an AI professor, debating classmates, whiteboard drawings, voice Q&A, and adaptive practice.',
  keywords: ['AI', 'learning', 'classroom', 'education', 'AI tutor', 'interactive learning'],
  authors: [{ name: 'AIDU' }],
  openGraph: {
    title: 'AIDU - Your AI Classroom, Anywhere',
    description: 'Turn any topic into a live lesson with an AI professor, debating classmates, whiteboard drawings, voice Q&A, and adaptive practice.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
