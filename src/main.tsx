import React from 'react'
import ReactDOM from 'react-dom/client'
import SiteRouter from './site/SiteRouter'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import './styles/index.css'
import './site/site.css'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><SiteRouter /><PwaUpdatePrompt /></React.StrictMode>)
