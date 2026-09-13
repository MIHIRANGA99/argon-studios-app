# ARGON Studios — Luxury WebAR Greeting & Stationery Platform

<div align="center">
  <img src="public/brand/logo_2d.jpg" alt="ARGON Studios Emblem" width="120" style="border-radius: 20px; box-shadow: 0 0 25px rgba(212, 175, 55, 0.3);" />
  <h3>Spatial Print & Augmented Experiences</h3>
  <p>An end-to-end luxury WebAR Greeting & Stationery Card agency platform built with zero running costs.</p>
</div>

---

## 🌟 Overview

**ARGON Studios** bridges physical fine-art stationery (luxury wedding invitations, birthday milestones, VIP executive business cards) with interactive Augmented Reality:

- **Zero App Download**: Runs 100% in mobile browsers (iOS Safari & Android Chrome).
- **True Optical Target Tracking**: Powered by **MindAR.js** and **Three.js**, physical printed cards magically come to life in 6DoF perspective when viewed through the camera.
- **Hybrid "Pop Out to 3D" Mode**: Allows guests to comfortably detach the card into floating gyroscope mode to fill out RSVPs or view maps without aiming at the paper for minutes.
- **Agency Admin Studio**: Full campaign creation wizard, media dropzones, live Supabase cloud sync, and commercial print sheet generator with 3mm bleed & crop marks.

---

## 🚀 Key Features

### 1. WebAR Viewer Experience (Mobile)
- **MindAR Optical Tracking**: Locks video textures, champagne gold frames, and 3D particle systems directly onto physical printed cards.
- **Motion Sensors**: Hardware gyroscope (`deviceorientation`) for tilt perspective in floating 3D mode.
- **Interactive Actions**:
  - In-AR RSVP submission with real-time guest counters.
  - 1-Click vCard contact download for VIP networking cards.
  - One-tap venue map navigation (Google Maps).
  - Spatial audio unmuting gesture complying with mobile browser autoplay policies.

### 2. Agency Admin Studio (Web)
- **Campaign Hub**: Filter cards by category (Weddings, Birthdays, Business).
- **In-Place Card Editor**: Update videos, event dates, and details anytime without invalidating printed QR codes.
- **Commercial Print Sheet Generator**: Standard formats (5"×7", A5, Business Card) with 3mm bleed margins, corner crop marks, and 300 DPI high-res export.
- **RSVP Management Inbox**: Live guest attendee list with CSV export for catering and event planners.
- **Card Creation Wizard**: 4-step builder with drag-and-drop media uploaders to Supabase Storage.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **3D & AR Engine**: Three.js, MindAR.js (WebAssembly / WebGL)
- **Database & Storage**: Supabase (PostgreSQL + Cloud Storage)
- **Deployment**: Vercel ($0 Hosting)

---

## 📦 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/MIHIRANGA99/argon-studios-app.git
cd argon-studios-app
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set Framework Preset to **Vite**.
4. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
5. Deploy! Your WebAR platform will be live on an HTTPS domain with immediate camera permissions.

---

## 📄 License
Private commercial license — ARGON Studios Atelier.
