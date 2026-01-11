import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { ClickProvider, CsprClickThemes } from '@make-software/csprclick-ui'
import App from './App'

// CSPR.click configuration
const clickOptions = {
    appName: 'CasperAutomations',
    appId: 'csprclick-template',
    contentMode: 'iframe',
    providers: ['casper-wallet'],
}

// Extended theme
const AppTheme = {
    ...CsprClickThemes.dark,
    topBarBackground: '#1a1f35',
    backgroundColor: '#0f1429',
}

function AppWrapper() {
    return (
        <ClickProvider options={clickOptions}>
            <ThemeProvider theme={AppTheme}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ThemeProvider>
        </ClickProvider>
    )
}

export default AppWrapper
