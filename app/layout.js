import './globals.css'

export const metadata = {
  title: 'PD-Match Dadakan — Padel Matchmaker',
  description: 'Spontaneous padel matches, quick tournament setup, and live score tracking.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
