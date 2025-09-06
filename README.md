# Pallanguzhi Web Game

A traditional Tamil strategy game brought to the digital world by **Ziora Studios**.

![Pallanguzhi Game](https://img.shields.io/badge/Game-Pallanguzhi-success)
![Technology](https://img.shields.io/badge/Technology-HTML5%20%7C%20CSS3%20%7C%20JavaScript-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

## 🎮 About the Game

Pallanguzhi is an ancient Tamil board game from South India, belonging to the Mancala family of games. With over 1,000 years of history, this strategic game was traditionally played using tamarind seeds on wooden boards carved with holes.

### Features

- **Authentic Gameplay**: Traditional Pallanguzhi rules and mechanics
- **Multiple Game Modes**: Player vs Player and Player vs CPU
- **AI Difficulty Levels**: Easy, Medium, Hard, and Expert
- **Progressive Web App (PWA)**: Install and play offline
- **Retro Aesthetic**: Nostalgic gaming experience
- **Responsive Design**: Works on desktop and mobile devices
- **Winning Probability Indicator**: Real-time game analysis

## 🚀 Play Online

Visit [Live Demo](https://pallanguzhi-web.vercel.app) to play now!

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **PWA Features**: Service Worker, Web App Manifest
- **AI Implementation**: Minimax Algorithm for CPU opponents
- **Deployment**: Vercel

## 🎯 Game Rules

1. Each hole starts with 5 dots
2. Pick any hole on your side and take all the dots
3. Drop one dot in each hole, moving counter-clockwise around the board
4. After the last dot lands, pickup dots from the next hole and continue
5. Your turn ends if you land in a hole and the next two holes are empty
6. Score points when you land in a hole, the next hole is empty, and you take dots from the hole after that
7. The player with the most dots at the end wins!

## 🏗️ Installation & Development

### Prerequisites
- Modern web browser
- Local web server (optional for development)

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/viralvfx/pallanguzhi-web.git
cd pallanguzhi-web
```

2. Serve the files using a local web server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to `http://localhost:8000`

### Project Structure

```
pallanguzhi-web-game/
├── index.html          # Main game interface
├── style.css           # Game styling and animations
├── script.js           # Game logic and AI implementation
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker for offline functionality
├── vercel.json        # Vercel deployment configuration
└── README.md          # Project documentation
```

## 🎨 Cultural Heritage

This digital adaptation preserves the authentic gameplay while making it accessible to modern players worldwide. Pallanguzhi was traditionally played by women and children, helping develop mathematical skills and strategic thinking.

## 🏢 About Ziora Studios

**Ziora Studios** is dedicated to preserving cultural heritage through innovative digital experiences. We specialize in bringing traditional games and stories to the modern world with authentic gameplay and engaging user experiences.

**Tagline**: *"Preserving Heritage Through Gaming"*

## 🤝 Contributing

We welcome contributions to improve the game! Please feel free to submit issues and pull requests.

### Development Guidelines

1. Maintain authentic gameplay mechanics
2. Ensure cross-browser compatibility
3. Keep the retro aesthetic consistent
4. Test on both desktop and mobile devices
5. Follow semantic HTML and accessible design practices

## 📱 PWA Features

- **Offline Play**: Game works without internet connection
- **Install to Home Screen**: Add to your device's home screen
- **Native App Experience**: Full-screen gameplay
- **Fast Loading**: Cached resources for quick startup

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Demo**: [https://pallanguzhi-web.vercel.app](https://pallanguzhi-web.vercel.app)
- **Repository**: [https://github.com/viralvfx/pallanguzhi-web](https://github.com/viralvfx/pallanguzhi-web)
- **Studio Website**: [Ziora Studios](https://ziorastudios.com) *(coming soon)*

---

*Experience 1000+ years of gaming heritage with Pallanguzhi!*

© 2024 Ziora Studios - Preserving Heritage Through Gaming