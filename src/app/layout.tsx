import { Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import 'sweetalert2/src/sweetalert2.scss';
import '../styles/custom-swal.scss';

const outfit = Outfit({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>

        <Script
          src="https://unpkg.com/topojson@3"
          strategy="afterInteractive"
        />

        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
