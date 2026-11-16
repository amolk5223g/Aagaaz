# AAGAZZ 2K26 – Freshers' Event Management Platform
**Two Independent Web Applications | Shared FastAPI Backend & Supabase Database**

Organized by the **Department of Artificial Intelligence and Data Science (AI & DS)**  
**S. G. Balekundri Institute of Technology (SGBIT)**, S. S. Education Trust, Belagavi, Karnataka – 590010.

---

## ✦ System Architecture Overview

The system consists of **TWO SEPARATE WEB APPLICATIONS** with independent deployments and user interfaces, powered by a single shared FastAPI REST API and Supabase/PostgreSQL database.

```
Aagaz/
├── aagazz-user-portal/       # PROJECT 1: Student Invitation + 3D Music Player + Direct Ticket QR Pass
├── aagazz-admin-portal/      # PROJECT 2: Admin Dashboard + Whitelist CSV/XLSX Import + Volunteer Scanner
├── aagazz-backend/           # SHARED BACKEND: FastAPI REST API, Auth, Cryptographic Tokens, Atomic Redemption
├── database/
│   ├── migrations/           # 001_initial_schema.sql (PostgreSQL / Supabase DDL)
│   ├── policies.sql          # Row Level Security (RLS) policies
│   ├── seed.sql              # Default admin, volunteers, official event
│   └── sample_students_450.csv # 450 AI & DS student records for admin bulk testing
└── assets/                   # Official AAGAZZ 2K26 poster extracted from Google Stitch
```

---

## ✦ Official Event Details

- **Event:** AAGAZZ 2K26 (Freshers' Function)
- **Batch:** 2025–29 (Department of Artificial Intelligence and Data Science)
- **Date:** 20 November 2026
- **Time:** 10:00 AM – 2:00 PM IST
- **Venue:** Auditorium C102, Department of AI & DS, SGBIT Belagavi
- **Primary Tagline:** *"Where Minds Connect and Futures Begin."*
- **Secondary Tagline:** *"Explore • Innovate • Excel with AI."*
- **Chief Guest:** Dr. B. R. Patagundi (Principal, SGBIT)
- **Chairman, GC:** Dr. F. V. Manvi (Chairman, Governing Council, SGBIT)
- **HOD:** Dr. Mallikarjun Math (Head of Department, AI & DS)
- **Faculty Coordinator:** Prof. Neha Jadhav
- **Student Coordinators:** Ms. Rakhi Kshirasagar, Mr. Shubham Kadam, Ms. Supriya Dadadamani, Mr. Saisagar Naik

---

## ✦ Core Features & Workflow

### 1. Student Portal (`aagazz-user-portal`)
- **Cinematic Landing Page:** Cinematic black & champagne gold theme with live event countdown, interactive dignitary cards, and official poster gallery.
- **Rocking Background Anthem:** Integrated floating 3D music player playing the official AAGAZZ rocking theme with equalizer sound waves and mute/play toggle.
- **Direct VIP Food Pass Access:**
  - Student enters **College USN** + **Event Passcode** (`AAGAZZ2026`).
  - Whitelist eligibility check verifies AI & DS approval.
  - Instantly claims 3D digital food coupon ticket with unique QR code.
  - Exactly one coupon per USN guarantee (refreshing or returning returns the exact same coupon).
  - Persistent login (students stay logged in on their device).

### 2. Admin & Scanner Portal (`aagazz-admin-portal`)
- **Admin Dashboard:** Real-time analytics (Total Whitelisted, Registered Students, Coupons Issued, Active Passes, Redeemed Passes, Remaining Passes) and one-click Event Registration Toggle.
- **Whitelist CSV/XLSX Bulk Importer:** Drag-and-drop university roster upload supporting `USN`, `Student Name`, `Year`. Validates department, deduplicates, and provides downloadable error reports.
- **Volunteer Mobile QR Scanner:** Mobile camera QR scanner powered by `html5-qrcode` with Web Audio API sound feedback (harmonic success chord vs alert buzz), flashlight toggle, and manual code entry fallback.
- **Volunteer Management:** Admin can provision volunteer accounts and monitor scan counts in real time.

---

## ✦ Deployment Guide

### A. Backend Deployment (Railway / Render / VPS)
1. Set the following environment variables:
   ```env
   ENVIRONMENT=production
   DEBUG=False
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   SUPABASE_URL=https://[PROJECT_REF].supabase.co
   SUPABASE_KEY=[YOUR_SUPABASE_ANON_KEY]
   EVENT_ACCESS_CODE=AAGAZZ2026
   SECRET_KEY=[STRONG_RANDOM_SECRET]
   ```
2. Build & Start command:
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### B. Student Portal Deployment (Vercel / Netlify / Cloudflare Pages)
1. Root directory: `aagazz-user-portal`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable:
   ```env
   VITE_API_BASE_URL=https://your-backend-api.com/api/v1
   ```

### C. Admin Portal Deployment (Vercel / Netlify / Cloudflare Pages)
1. Root directory: `aagazz-admin-portal`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable:
   ```env
   VITE_API_BASE_URL=https://your-backend-api.com/api/v1
   ```

---

## ✦ Default Credentials

- **Common Student Passcode:** `AAGAZZ2026`
- **Admin Portal Login:** `admin@sgbit.edu.in` | `Aagazz@2026`
- **Volunteer Scanner Login:** `volunteer@sgbit.edu.in` | `Volunteer@2026`

---

## ✦ Local Development Quickstart

```powershell
# 1. Run all three services in parallel
powershell -ExecutionPolicy Bypass -File .\start_all.ps1

# Access locally:
# Student Portal:  http://localhost:5173
# Admin Portal:    http://localhost:5174
# Backend Docs:    http://localhost:8000/docs
```
