import type { Metadata } from 'next';
import { spaceGrotesk, inter, jetbrainsMono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tender Intelligence for Software Companies',
  description:
    'Find public software tenders, understand requirements and prioritize opportunities using your company profile.',
  openGraph: {
    title: 'Tender Intelligence for Software Companies',
    description:
      'Find public software tenders, understand requirements and prioritize opportunities using your company profile.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
