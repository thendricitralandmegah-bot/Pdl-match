import './globals.css'

export const metadata = {
  title: 'PD-Match Dadakan — Padel Session Manager',
  description: 'Plan padel sessions, balance rotations, manage courts, and track live scores.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
