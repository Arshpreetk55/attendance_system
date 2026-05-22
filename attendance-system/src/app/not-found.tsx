import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>
        404
      </h1>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        Page not found
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px', textAlign: 'center' }}>
        Sorry, the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        style={{
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        Go back home
      </Link>
    </div>
  )
}
