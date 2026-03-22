tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#3fe4ad",
            "background-light": "#f6f8f7",
            "background-dark": "#11211c",
            "foreground-light": "#050505",
            "foreground-dark": "#fbfbfb",
            "card-light": "#ffffff",
            "card-dark": "#1a2c26",
            "muted-light": "#6b7280",
            "muted-dark": "#9ca3af",
            "border-light": "#e5e7eb",
            "border-dark": "#374151",
            "input-light": "#f6f8f7",
            "input-dark": "#2d3748"
          },
          fontFamily: {
            "display": ["Inter", "sans-serif"]
          },
          borderRadius: {
            "DEFAULT": "0.5rem",
            "lg": "0.75rem",
            "xl": "1rem",
            "full": "9999px"
          },
          boxShadow: {
            'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          }
        },
      },
    }