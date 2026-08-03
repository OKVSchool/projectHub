import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Nav from '@/components/Nav'

export const metadata = {
  title: 'projectHub',
  description: 'Your developer portfolio and project tracker'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
