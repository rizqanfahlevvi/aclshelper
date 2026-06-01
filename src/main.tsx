import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/colors-and-type.css'
import './styles/components.css'
import './styles/acls.css'
import { registerSW } from 'virtual:pwa-register'

/* When a new service worker activates (skipWaiting already claimed
   the client), reload so the page loads fresh JS/CSS bundles. */
registerSW({
  onNeedRefresh() {
    window.location.reload()
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
