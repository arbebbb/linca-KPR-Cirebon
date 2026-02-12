# LINCA Dashboard

Dashboard untuk tracking progress aplikasi KPR & Consumer Loan.

## Features

### Public Features (Tanpa Login)
- ✅ **Dashboard Overview** - Ringkasan status aplikasi (Inproses, Approve, PK, Reject, Realisasi)
- ✅ **Search** - Cari progress berdasarkan nama debitur atau nomor aplikasi
- ✅ **Filter** - Filter berdasarkan status, area
- ✅ **Export CSV** - Download data ke format CSV
- ✅ **WhatsApp Contact** - Link langsung ke WhatsApp sales

### Admin Features (Memerlukan Login)
- ✅ **Login Authentication** - JWT-based authentication
- ✅ **Dashboard Admin** - Overview statistik dan aplikasi terbaru
- ✅ **CRUD Aplikasi** - Tambah, edit, hapus data aplikasi
- ✅ **Modal Forms** - Add/Edit menggunakan modal dialog
- ✅ **Delete Confirmation** - Konfirmasi sebelum hapus
- ✅ **Pagination** - Navigasi data dengan pagination
- ✅ **Responsive** - Mobile-friendly admin panel

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Lucide Icons
- Sonner (Toast notifications)

### Backend (PHP API)
- PHP 8+
- MySQL/MariaDB
- JWT Authentication
- RESTful API

## Project Structure

```
dash-linca/
├── app/
│   ├── globals.css         # Global styles with Navy/Orange theme
│   ├── layout.tsx          # Root layout with Toaster
│   ├── page.tsx            # Public dashboard
│   └── admin/
│       ├── layout.tsx      # Admin layout with sidebar
│       ├── login/
│       │   └── page.tsx    # Admin login page
│       ├── dashboard/
│       │   └── page.tsx    # Admin dashboard
│       └── applications/
│           └── page.tsx    # CRUD applications
├── lib/
│   ├── api.ts              # API service layer
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
├── hooks/
│   └── use-auth.tsx        # Auth context/hooks
├── components/ui/          # shadcn/ui components
├── apitemplate/
│   ├── database.sql        # Database schema
│   ├── db.php              # Database connection
│   ├── applications.php    # Applications CRUD API
│   └── admin.php           # Admin auth API
└── .env.local              # Environment variables
```

## Database Setup

1. Import database schema:
```sql
-- Run apitemplate/database.sql in your MySQL/MariaDB
```

2. Default admin credentials:
- Username: `admin`
- Password: `admin123`

## API Endpoints

### Applications API (`/applications.php`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/applications.php` | Get all applications | No |
| GET | `/applications.php?id={id}` | Get single application | No |
| GET | `/applications.php?search={name}` | Search by name | No |
| GET | `/applications.php?stats=true` | Get statistics | No |
| GET | `/applications.php?filters=true` | Get filter options | No |
| GET | `/applications.php?export=csv` | Export to CSV | No |
| POST | `/applications.php` | Create application | Yes |
| PUT | `/applications.php?id={id}` | Update application | Yes |
| DELETE | `/applications.php?id={id}` | Delete application | Yes |

### Admin API (`/admin.php`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin.php?action=login` | Login | No |
| POST | `/admin.php?action=register` | Create admin | Yes |
| PUT | `/admin.php?action=password` | Change password | Yes |
| GET | `/admin.php?action=verify` | Verify token | Yes |

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://fire.vadr.my.id/linca
```

## Deployment

### Frontend (Vercel/Netlify)
1. Push to GitHub
2. Connect to Vercel/Netlify
3. Set environment variables
4. Deploy

### Backend (cPanel/Shared Hosting)
1. Upload PHP files to `public_html/linca/`
2. Import `database.sql` to MySQL
3. Update `db.php` with database credentials

## Color Scheme

- **Navy (Primary)**: `#1e3a5f` - Headers, sidebar, primary buttons
- **Orange (Accent)**: `#f97316` - CTAs, highlights, active states
- **Status Colors**:
  - Inproses: Blue
  - Approve: Green
  - PK: Purple
  - Reject: Red
  - Realisasi: Emerald
  - Onhand: Yellow
  - SPPK: Indigo

## Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build for production
npm run build
```

## Credits

Built by Ascendweb.id for LINCA
