# Time Timer

A beautiful visual countdown timer web application inspired by the iconic Time Timer. See time remaining at a glance with a colorful, sweeping display.

![Time Timer Screenshot](docs/screenshot.png)

## Features

- **Visual Countdown**: Large circular display shows time remaining with a colored arc that sweeps as time passes
- **Color-Coded Progress**: Arc color smoothly transitions from green → yellow → orange → red as time runs out
- **Preset Durations**: Quick-select buttons for 5, 10, 15, 30, 45, and 60 minutes
- **Smooth Animations**: 60fps canvas-based animations for a satisfying visual experience
- **Sound Notification**: Pleasant chime plays when the timer completes (can be toggled off)
- **Haptic Feedback**: Vibration on mobile devices when timer completes
- **Dark Mode**: Automatic system detection or manual toggle between light/dark themes
- **Offline Support**: Works offline via Service Worker - perfect for focus sessions
- **Mobile-First Design**: Touch-friendly controls and responsive layout
- **Persistent Preferences**: Your settings are saved locally

## Demo

```
┌─────────────────────────────┐
│       Time Timer            │
│    Visual countdown timer   │
│                             │
│     ╭───────────────╮       │
│    ╱   ╭─────────╮   ╲      │
│   │   │         │    │      │
│   │   │  05:00  │    │      │
│   │   │ Running │    │      │
│    ╲   ╰─────────╯   ╱      │
│     ╰───────────────╯       │
│                             │
│  [5m] [10m] [15m] [30m]...  │
│                             │
│        [ Pause ]            │
│                             │
│  🔊 Sound On    ○ ☀ ●       │
└─────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/time-timer.git
cd time-timer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Docker

### Build and Run Locally

```bash
# Build the image
docker build -t time-timer .

# Run the container
docker run -p 8080:80 time-timer
```

The app will be available at `http://localhost:8080`

### Pull from GitHub Container Registry

```bash
# Pull the latest image
docker pull ghcr.io/yourusername/time-timer:latest

# Run it
docker run -p 8080:80 ghcr.io/yourusername/time-timer:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  time-timer:
    image: ghcr.io/yourusername/time-timer:latest
    ports:
      - "8080:80"
    restart: unless-stopped
```

## Deployment

### Nginx (Standalone)

1. Build the project: `npm run build`
2. Copy `dist/` contents to your nginx web root
3. Configure nginx with the provided `nginx.conf` as a reference

### Docker on Any Platform

The Docker image is self-contained with nginx. Deploy to any container platform:

- **Docker Swarm**: `docker service create -p 8080:80 ghcr.io/yourusername/time-timer`
- **Kubernetes**: Use the image in a Deployment with a Service
- **Cloud Run / App Runner / ECS**: Deploy the container image directly

### Static Hosting

The built `dist/` folder can be deployed to any static hosting:

- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

## Project Structure

```
time-timer/
├── src/
│   ├── components/       # React components
│   │   ├── TimerDisplay.tsx    # Canvas-based timer visualization
│   │   ├── PresetButtons.tsx   # Duration preset buttons
│   │   ├── Controls.tsx        # Start/Pause/Resume/Reset buttons
│   │   └── Settings.tsx        # Sound and theme toggles
│   ├── hooks/           # Custom React hooks
│   │   └── useTimer.ts         # Timer state management
│   ├── utils/           # Helper functions
│   │   ├── time.ts             # Time formatting and colors
│   │   ├── sound.ts            # Audio notification
│   │   └── storage.ts          # LocalStorage persistence
│   ├── styles/          # Global styles
│   │   └── index.css           # Tailwind imports
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry point
├── public/              # Static assets
│   ├── sw.js                   # Service Worker
│   ├── manifest.json           # PWA manifest
│   └── timer.svg               # App icon
├── tests/               # Test files
│   ├── useTimer.test.ts        # Timer hook tests
│   ├── time.test.ts            # Utility function tests
│   └── storage.test.ts         # Storage tests
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
├── Dockerfile           # Multi-stage Docker build
├── nginx.conf           # Nginx configuration
└── package.json
```

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI component library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **Canvas API** | Smooth timer animations |
| **Web Audio API** | Completion sound generation |
| **Service Worker** | Offline support |
| **Vitest** | Unit testing framework |
| **Docker + nginx** | Production deployment |
| **GitHub Actions** | CI/CD pipeline |

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by the [Time Timer](https://www.timetimer.com/) - a brilliant visual timer concept that helps people understand the passage of time.
