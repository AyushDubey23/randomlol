import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import PortfolioAnalyticsTracker from '@/components/portfolio-analytics-tracker'
import './globals.css'

const siteUrl = 'https://hridaybajaj.com'
const siteTitle = 'Hriday Bajaj | Filmmaker, Director & Editor'
const siteDescription =
  'Hriday Bajaj is an Indian filmmaker, director, and editor based in London. Explore his creative portfolio featuring short films, documentaries, music videos, and visual storytelling.'

export const viewport: Viewport = {
  themeColor: '#fafafa',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s | Hriday Bajaj',
  },
  description: siteDescription,
  applicationName: 'Hriday Bajaj Portfolio',
  authors: [
    { name: 'Hriday Bajaj', url: siteUrl },
    { name: 'Ayush Dubey', url: 'https://ayushdubey23.vercel.app/' },
  ],
  creator: 'Hriday Bajaj',
  publisher: 'Hriday Bajaj',
  keywords: [
    'Hriday Bajaj',
    'Hriday',
    'Bajaj',
    'Filmmaker',
    'Director',
    'Editor',
    'Cinematographer',
    'Gaffer',
    'Producer',
    'Writer',
    'Sound Designer',
    'Photographer',
    'London Filmmaker',
    'Film Portfolio',
    'University of the Arts London',
    'UAL Film',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'Hriday Bajaj Portfolio',
    locale: 'en_GB',
    type: 'website',
    images: [
      {
        url: '/Hriday.jpg',
        width: 1200,
        height: 630,
        alt: 'Hriday Bajaj - Filmmaker & Director',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/Hriday.jpg'],
    creator: '@bajaj_hriday',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: 'Hriday Bajaj',
      jobTitle: 'Filmmaker, Director & Editor',
      description: siteDescription,
      url: siteUrl,
      image: `${siteUrl}/Hriday.jpg`,
      email: 'mailto:bajajhriday2005@gmail.com',
      alumniOf: {
        '@type': 'EducationalOrganization',
        name: 'University of the Arts London',
      },
      sameAs: [
        'https://instagram.com/bajaj_hriday',
        'https://www.linkedin.com/in/hridaybajaj019/',
      ],
      knowsAbout: [
        'Filmmaking',
        'Film Directing',
        'Film Editing',
        'Cinematography',
        'Sound Design',
        'Documentary Production',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Hriday Bajaj Portfolio',
      description: siteDescription,
      publisher: {
        '@id': `${siteUrl}/#person`,
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        <PortfolioAnalyticsTracker />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
