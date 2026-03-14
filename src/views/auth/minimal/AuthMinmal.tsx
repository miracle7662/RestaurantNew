import { ReactNode, Suspense } from 'react'
import Logo from '@/components/Common/Logo'
import Copyright from '@/components/Misc/Copyright'
import { Card, Stack, Badge } from 'react-bootstrap'

interface AuthMinmalProps {
  children?: ReactNode
  onLogoClick?: () => void
}

const AuthMinmal = ({ children, onLogoClick }: AuthMinmalProps) => {
  return (
    <Suspense fallback={<div />}>
      <Stack
        className="auth-layout align-items-center justify-content-center mx-4 mx-sm-6"
        style={{ minHeight: '100vh' }}
      >
        <div className="mt-6 mt-sm-8 position-relative">
          <Logo onClick={onLogoClick} />
          {onLogoClick && (
            <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle">
            </Badge>
          )}
        </div>
        <Card className="w-100 mx-auto my-6 my-sm-8" style={{ maxWidth: '400px' }}>
          <Card.Body className="py-8 py-sm-8 px-sm-8">{children}</Card.Body>
        </Card>
        <div className="mb-6 mb-sm-8">
          <Copyright />
        </div>
      </Stack>
    </Suspense>
  )
}

export default AuthMinmal
