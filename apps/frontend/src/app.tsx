import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { MiniAppProvider } from './contexts/MiniAppContext'

import router from './router'
import './index.css'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MiniAppProvider>
			<RouterProvider router={router} />
		</MiniAppProvider>
	</StrictMode>
);
