import type { Metadata } from 'next';
import { spaceGrotesk, inter, jetbrainsMono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tender Intelligence',
  description: 'Tender opportunity matching and pipeline management',
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
