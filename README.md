# 🎯 Hanan Dashboard

Admin dashboard for managing portfolio website data, messages, and analytics.

## 🚀 Live Demo

**URL:** [https://hanan-develop.github.io/hanan-dashboard/](https://hanan-develop.github.io/hanan-dashboard/)

**Demo Credentials:**
- Username: `hanan`
- Password: `hanan@2026`

## 📋 Features

### ✅ Phase 1 (Complete)
- Beautiful glassmorphism login page
- Floating glow orbs + perspective grid background
- AH monogram avatar with animated rings
- Username/Password with floating labels
- Show/hide password toggle
- "Remember me" checkbox (extends session to 7 days)
- Form validation with shake animation on error
- localStorage-based session management
- Auto-redirect if already logged in
- Toast notifications
- Fully responsive

### ⏭️ Phase 2 (Coming Next)
- Full dashboard layout with collapsible sidebar
- Top header with search, notifications, profile
- Welcome card with user greeting
- Stats overview (4 animated cards)
- Visitor chart (Chart.js)
- Recent activity timeline
- Quick action buttons

### 🔮 Future Phases
- Messages inbox module
- Analytics with Chart.js (visitors, devices, browsers)
- Projects management (CRUD)
- Testimonials management
- Site settings
- Portfolio integration (visitor tracker, form handler)

## 🛠️ Tech Stack

- HTML5
- CSS3 (Glassmorphism, Animations)
- Vanilla JavaScript + jQuery
- localStorage (data persistence)
- Chart.js (charts - Phase 2)
- Font Awesome (icons)
- Google Fonts (Sora + Nunito)

## 🎨 Design

Same theme as the [Hanan Portfolio](https://hanan-develop.github.io/hanan-portfolio/):
- Dark glassmorphism with yellow accents (#f9ca24)
- Sora + Nunito fonts
- Smooth animations
- Light/Dark theme support

## 📁 File Structure

```
hanan-dashboard/
├── index.html          # Login page
├── dashboard.html      # Main dashboard
├── css/
│   ├── auth.css        # Login page styles
│   └── dashboard.css   # (Coming Phase 2)
├── js/
│   ├── auth.js         # Authentication system
│   └── dashboard.js    # (Coming Phase 2)
└── img/
```

## 🔐 Authentication Notes

This is a **client-side only** authentication system suitable for **demo and portfolio purposes**. For production use with sensitive data, implement server-side authentication.

- Session stored in localStorage
- 1 hour timeout (normal login)
- 7 days timeout ("Remember me" enabled)
- Auto-redirect to login on session expiry

## 👨‍💻 Author

**Abdul Hanan**
- Portfolio: [hanan-develop.github.io/hanan-portfolio](https://hanan-develop.github.io/hanan-portfolio/)
- GitHub: [@Hanan-develop](https://github.com/Hanan-develop)
- LinkedIn: [Abdul Hanan](https://www.linkedin.com/in/abdul-hanan-926a4b39a/)

## 📄 License

Personal project — for portfolio and demonstration purposes.
