import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App';
import { AuthProvider } from '@/common/context/useAuthContext'; // Import AuthProvider

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <BrowserRouter basename={''}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>,
  )
}
