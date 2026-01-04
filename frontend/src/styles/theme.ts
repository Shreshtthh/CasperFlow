// Theme colors for custom components (not using styled-components ThemeProvider)
export const theme = {
    colors: {
        background: '#0f1429',
        backgroundSecondary: '#1a1f35',
        backgroundCard: '#1e2340',
        primary: '#FF5733',
        primaryHover: '#ff6f4a',
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#f44336',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0A0A0',
        border: '#2a2f45',
    },
    fonts: {
        main: "'Inter', sans-serif",
        mono: "'JetBrains Mono', monospace",
    },
    borderRadius: {
        small: '8px',
        medium: '12px',
        large: '16px',
    },
    shadows: {
        card: '0 4px 20px rgba(0, 0, 0, 0.3)',
        button: '0 2px 10px rgba(255, 87, 51, 0.3)',
    },
}

export type Theme = typeof theme
