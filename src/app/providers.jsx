import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material/styles'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from './query-client'
import { store } from './store'

const theme = createTheme({
  palette: {
    primary: { main: '#254c35' },
    background: { default: '#fbfaf6', paper: '#ffffff' },
    text: { primary: '#1e2b22', secondary: '#637264' },
  },
  typography: { fontFamily: 'system-ui, sans-serif' },
  shape: { borderRadius: 8 },
})

export function AppProviders({ children }) {
  return <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <BrowserRouter>{children}</BrowserRouter>
        </ThemeProvider>
      </StyledEngineProvider>
    </QueryClientProvider>
  </Provider>
}
