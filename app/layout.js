import './globals.css'

export const metadata = {
  title: 'PDLUP — Padel Matchmaker',
  description: 'Create balanced padel matches, track scores, and run better tournaments.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
