# Attendly

A modern wedding invitation management system built with Next.js, TypeScript, and PostgreSQL. Attendly allows you to create, manage, and track digital wedding invitations with QR codes for easy RSVP management.

## ✨ Features

### 🎫 Invitation Management
- **Create Digital Invitations**: Generate personalized wedding invitations with event details
- **QR Code Generation**: Automatic QR code creation for each invitation
- **RSVP Tracking**: Real-time status updates (Pending, Confirmed, Declined, Rescinded)
- **Plus-One Support**: Manage additional guests for each invitation

### 📊 Admin Dashboard
- **Real-time Metrics**: Live dashboard with attendance statistics and trends
- **Status Updates**: Recent RSVP changes with timestamp tracking
- **Paginated Tables**: Efficient browsing of large invitation lists (10 per page)
- **Interactive Charts**: Visual representation of RSVP data
- **QR Code Downloads**: Bulk download capabilities for invitation QR codes

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Brand Consistency**: Custom color scheme (rgb(192, 122, 84))
- **Accessible Interface**: WCAG compliant components and interactions
- **Real-time Updates**: Live data synchronization across all views

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM 5.19.1
- **State Management**: Redux Toolkit Query (RTK Query)
- **QR Codes**: qrcode library for generation
- **Development**: ESLint, Prettier, TypeScript strict mode

## 🚀 Getting Started

### Prerequisites

- Node.js 20.10.0 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Configure your database connection and other environment variables.

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Optional: Open Prisma Studio to view data
   npm run db:studio
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run lint:check` - Check linting without fixing
- `npm run type-check` - Run TypeScript compiler check
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database and run migrations

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── invite/            # Public invitation pages
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   └── ui/               # Common UI components
├── lib/                   # Utility functions and configurations
│   ├── db.ts             # Database service with Prisma
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions
└── store/                 # Redux store and API slices
    ├── invitationApi.ts  # RTK Query API definitions
    └── store.ts          # Redux store configuration
```

## 🎯 Key Features Walkthrough

### Admin Dashboard
- **Metrics Overview**: Total invitations, confirmed/pending/declined counts, attendance rates
- **Status Updates**: Real-time feed of recent RSVP changes with timestamps
- **Invitation Management**: Create, edit, and track all invitations in paginated tables
- **QR Code Management**: Download individual or bulk QR codes for distribution

### Invitation Flow
1. **Create**: Admin creates invitation with guest details and event information
2. **Generate**: System automatically generates unique QR code for each invitation
3. **Distribute**: QR codes can be downloaded and shared with guests
4. **RSVP**: Guests scan QR code to access their personalized invitation page
5. **Track**: Real-time updates appear in admin dashboard

## 🔧 Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **Invitation**: Core invitation data with guest information and RSVP status
- **Event Details**: Wedding event information (date, venue, etc.)
- **RSVP Tracking**: Status changes and timestamps

## 🚀 Deployment

### Environment Variables

Required environment variables for production:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

### Build & Deploy

```bash
# Build the application
npm run build

# Start production server
npm run start
```

The app is optimized for deployment on Vercel, Netlify, or any Node.js hosting platform.

## 📈 Performance Features

- **Server-Side Rendering**: Fast initial page loads with Next.js SSR
- **Database Optimization**: Efficient queries with Prisma and connection pooling
- **Pagination**: Handles large datasets with efficient server-side pagination
- **Caching**: RTK Query provides intelligent data caching and invalidation
- **Bundle Optimization**: Tree-shaking and code splitting for minimal bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.
