import "./globals.css";
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'PersonalRM',
  description: 'Personal Relationship Manager',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body>
        <AuthProvider>
          <div style={{ height: '100%' }}>
            {children}
            <Toaster position="bottom-right" />
            <script dangerouslySetInnerHTML={{__html: `
              window.onerror = function(message, source, lineno, colno, error) {
                console.error('Global error:', message, 'at', source, lineno, colno, error);
              };
            `}} />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
