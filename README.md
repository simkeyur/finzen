# FinZen 💰

**Smart Financial Planning**

A modern, Progressive Web App (PWA) for comprehensive financial calculations including retirement planning, mortgage analysis, loan calculations, and investment projections.

![FinZen](assets/finzen-app.png)

## 🌟 Features

### 📊 Four Powerful Calculators

1. **Retirement Calculator**
   - Plan your retirement savings with customizable contribution schedules
   - Toggle between monthly and yearly contributions
   - View yearly breakdown with age progression
   - Visual pie chart showing contributions vs. growth
   - Detailed amortization table

2. **Mortgage Calculator**
   - Calculate monthly payments and total interest
   - Flexible down payment (amount or percentage)
   - Complete monthly amortization schedule
   - Track principal and interest breakdown

3. **Loan Calculator**
   - Simple loan payment calculations
   - Monthly amortization schedule
   - Clear breakdown of principal vs. interest

4. **Investment Calculator**
   - Project investment growth over time
   - Monthly contribution support
   - Yearly breakdown showing contributions and interest
   - Compound interest calculations

### ✨ Key Highlights

- 📱 **Progressive Web App** - Install on your device and use offline
- 💾 **Auto-Save** - All inputs automatically saved to localStorage
- 🎨 **Modern Design** - Dark gradient theme with glassmorphic effects
- 📊 **Visual Charts** - ApexCharts integration for retirement planning
- 📋 **Detailed Tables** - Comprehensive amortization schedules
- 🔄 **Reset Option** - Clear all data through settings modal
- ⚡ **Fast & Responsive** - Optimized for mobile and desktop
- 🌐 **No Backend Required** - Pure client-side JavaScript

## 🚀 Live Demo

Visit the app: [https://simkeyur.github.io/finzen](https://simkeyur.github.io/finzen)

## 💻 Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom styling with animations and glassmorphism
- **Vanilla JavaScript** - No frameworks, pure JS
- **ApexCharts** - Beautiful, responsive charts
- **Service Worker** - Offline functionality
- **LocalStorage API** - Data persistence

## 📱 Installation

### As a PWA (Recommended)

1. Visit [https://simkeyur.github.io/finzen](https://simkeyur.github.io/finzen)
2. On mobile: Tap the "Add to Home Screen" option in your browser menu
3. On desktop: Click the install icon in the address bar
4. Launch the app from your home screen/app drawer

### Local Development

```bash
# Clone the repository
git clone https://github.com/simkeyur/finzen.git

# Navigate to the directory
cd finzen

# Open with a local server (required for PWA features)
# Using Python 3
python -m http.server 8000

# Or using Node.js http-server
npx http-server

# Visit http://localhost:8000
```

## 📂 Project Structure

```
finzen/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
├── styles/
│   └── styles.css     # All styling
├── js/
│   └── app.js         # Application logic
├── assets/
│   ├── 192.png        # App icon (192x192)
│   ├── 512.png        # App icon (512x512)
│   └── finzen-app.png # Screenshot
└── README.md          # This file
```

## 🎨 Design Features

- **Dark Gradient Background** - Smooth gradient from #0a0e27 to #1a1f3a
- **Glassmorphic Cards** - Frosted glass effect with backdrop blur
- **Teal Accent Color** - Primary color #00acc1
- **Smooth Animations** - CSS transitions and keyframe animations
- **Responsive Design** - Mobile-first approach
- **Custom Toggles** - Beautiful toggle switches for options

## 🔧 Features in Detail

### Currency Input Formatting
- Automatic comma insertion for thousands
- Supports decimal values
- Real-time formatting as you type
- Dollar sign prefix for currency fields

### Data Persistence
- All calculator inputs saved automatically
- Data persists across sessions
- Toggle states remembered
- Easy reset through settings

### Amortization Tables
- **Investment**: Yearly breakdown
- **Retirement**: Yearly with age progression
- **Mortgage**: Monthly payments
- **Loan**: Monthly payments

### Settings
- Accessible via gear icon in navbar
- Clean modal interface
- One-click data reset
- Confirmation before clearing data

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera
- Any modern browser with ES6 support

## 📊 Calculation Methods

### Compound Interest Formula
Used for investment and retirement calculations:
```
A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]
```

### Loan Payment Formula
Used for mortgage and loan calculations:
```
M = P × [r(1 + r)^n] / [(1 + r)^n - 1]
```

Where:
- A = Final amount
- P = Principal
- r = Interest rate (decimal)
- n = Number of periods
- PMT = Periodic payment
- M = Monthly payment

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Keyur Sim**
- GitHub: [@simkeyur](https://github.com/simkeyur)

## 🙏 Acknowledgments

- [ApexCharts](https://apexcharts.com/) - Beautiful charts library
- [Google Fonts](https://fonts.google.com/) - Inter font family
- [PWA Best Practices](https://web.dev/progressive-web-apps/) - PWA implementation guide

## 📈 Future Enhancements

- [ ] Export calculations to PDF
- [ ] Multiple currency support
- [ ] Tax calculation integration
- [ ] Inflation adjustment options
- [ ] Comparison mode for scenarios
- [ ] Dark/Light theme toggle
- [ ] Share calculation results
- [ ] Historical data tracking

## 🐛 Known Issues

None currently. Please report any bugs through GitHub Issues.

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/simkeyur/finzen/issues)
- Check existing issues for solutions

---

Made with ❤️ for better financial planning