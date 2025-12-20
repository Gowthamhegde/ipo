import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'IPO GMP Analyzer - Real-time IPO Analysis & Predictions',
  description: 'Complete IPO GMP tracking with ML predictions, real-time notifications, and investment insights for Indian stock market.',
  keywords: 'IPO, GMP, Grey Market Premium, Stock Market, India, Investment, ML Predictions',
  authors: [{ name: 'IPO GMP Analyzer Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#667eea',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <Toaster position="top-right" />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  © 2024 IPO GMP Analyzer. Built with ❤️ for investors.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}