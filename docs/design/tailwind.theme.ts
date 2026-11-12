// Drop into tailwind.config.ts -> theme.extend. Values mirror tokens.json.
export const docspaceTheme = {
  colors: {
    bg: '#f7f7f5', surface: '#ffffff', subtle: '#f2f2f0', muted: '#ebebe8',
    border: { DEFAULT: '#e6e6e3', strong: '#d6d6d2' },
    ink: { DEFAULT: '#18181b', 2: '#5f5f66', 3: '#6f6f76' },
    accent: { DEFAULT: '#3451d1', hover: '#2b44b8', soft: '#eef1fd' },
    success: { DEFAULT: '#1a7a43', soft: '#e8f5ee' },
    warning: { DEFAULT: '#a15c07', soft: '#fdf3e1' },
    danger: { DEFAULT: '#c4352b', soft: '#fdeceb' },
  },
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    display: ['"Inter Tight"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  },
  borderRadius: { sm: '4px', md: '6px', lg: '8px', xl: '12px' },
  boxShadow: {
    pop: '0 1px 2px rgba(16,16,20,.04), 0 8px 24px -6px rgba(16,16,20,.12)',
    dialog: '0 1px 2px rgba(16,16,20,.06), 0 24px 48px -12px rgba(16,16,20,.22)',
    page: '0 0 0 1px #e6e6e3, 0 1px 3px rgba(16,16,20,.04)',
  },
  width: { sidebar: '240px', page: '816px' },
  height: { control: '32px', 'control-lg': '36px', topbar: '52px', formatbar: '44px' },
  ringColor: { DEFAULT: 'rgba(52,81,209,.28)' },
};
// shadcn/ui CSS variables (globals.css, :root), HSL:
// --background: 60 9% 97%; --card: 0 0% 100%; --popover: 0 0% 100%;
// --foreground: 240 6% 10%; --muted: 60 5% 95%; --muted-foreground: 240 4% 39%;
// --border: 60 4% 90%; --input: 60 4% 83%; --ring: 229 62% 51%;
// --primary: 240 6% 10%; --primary-foreground: 0 0% 100%;
// --accent: 60 5% 95%; --accent-foreground: 240 6% 10%;   (shadcn "accent" = hover surface, not our brand accent)
// --destructive: 4 64% 47%; --radius: 0.375rem;
