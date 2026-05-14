# Wukala AI Nexus

A comprehensive legal tech platform that connects clients with qualified lawyers, provides AI-powered legal assistance, and offers resources for understanding Pakistani law.

## 🎯 Overview

Wukala AI Nexus is a modern, full-featured legal services platform built with React and TypeScript. It enables clients to find and connect with lawyers, access legal guides, explore case law, and receive AI-powered legal assistance. The platform includes dedicated features for lawyers to manage their practice through a comprehensive dashboard.

## ✨ Features

### For Clients
- **Lawyer Discovery & Booking** - Browse qualified lawyers and book appointments
- **AI Legal Chat** - Get instant legal assistance powered by AI
- **Document Management** - Upload and manage legal documents securely
- **Case Law Database** - Search and explore Pakistani case law
- **Legal Resources** - Access legal guides, dictionaries, and Pakistan laws
- **News & Updates** - Stay informed with legal news and updates
- **Direct Messaging** - Communicate securely with lawyers

### For Lawyers
- **Professional Dashboard** - Manage all aspects of your practice
  - Case Management - Organize and track cases
  - Client Management - Maintain client records and history
  - Appointments - Schedule and manage appointments
  - Messaging - Direct communication with clients
  - Document Handling - Manage case documents
  - AI Assistant - Get help with legal research and documentation
  - Profile Management - Showcase your expertise and qualifications
- **Lawyer Directory** - Professional listings to attract clients

### General Features
- **Authentication** - Secure role-based access (Client/Lawyer/Admin)
- **Responsive Design** - Fully mobile and desktop optimized
- **Admin Panel** - Platform administration and management
- **OTP Verification** - Secure two-factor authentication
- **Onboarding Tour** - Guided introduction for new users

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **TanStack Query (React Query)** - Data fetching and caching

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Unstyled, accessible component library

### Animation & Visual Effects
- **Framer Motion** - Advanced animations
- **Anime.js** - Lightweight animation library

### Forms & Validation
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

### Additional Libraries
- **date-fns** - Modern date utility library
- **Sonner & React Toaster** - Toast notifications
- **Embla Carousel** - Carousel components

## 📦 Project Structure

```
src/
├── components/           # Reusable React components
│   ├── ui/              # shadcn/ui components
│   ├── Layout.tsx       # Main layout wrapper
│   ├── MobileBottomNav.tsx
│   ├── OnboardingTour.tsx
│   └── PageTransition.tsx
├── pages/               # Page components
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Lawyer dashboard
│   ├── admin/           # Admin panel
│   └── [Other pages]    # Main app pages
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── assets/              # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Bun package manager (recommended) or npm

### Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd wukala-ai-nexus

# Install dependencies using bun (recommended)
bun install

# Or using npm
npm install

# Start the development server
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port)

## 📝 Available Scripts

```bash
# Start development server with hot module replacement
bun run dev

# Build for production
bun run build

# Build in development mode
bun run build:dev

# Preview production build locally
bun run preview

# Run ESLint to check code quality
bun run lint
```

## 🏗️ Build & Deployment

The project uses Vite for optimized builds:

```bash
# Production build
bun run build

# The build output will be in the dist/ directory
```

### Vercel Deployment
The project includes `vercel.json` configuration for easy deployment to Vercel.

## 📋 Key Pages & Routes

### Public Pages
- `/` - Home
- `/about` - About Us
- `/leadership` - Leadership Team
- `/faq` - Frequently Asked Questions
- `/how-it-works` - How the Platform Works
- `/pricing` - Pricing Plans
- `/contact` - Contact Us
- `/legal-guides` - Legal Education Resources
- `/security-privacy` - Privacy & Security
- `/pakistan-laws` - Pakistan Laws Database
- `/terms` - Terms of Service
- `/help` - Help & Support
- `/lawyers` - Lawyer Directory
- `/lawyer/:id` - Lawyer Details
- `/news` - Legal News
- `/dictionary` - Legal Dictionary
- `/case-law` - Case Law Database

### Authentication Routes
- `/login` - User Login
- `/auth/role` - Role Selection
- `/signup/client` - Client Registration
- `/signup/lawyer` - Lawyer Registration
- `/verify-otp` - OTP Verification
- `/profile` - User Profile Setup

### Client Routes
- `/chat` - AI Legal Assistant
- `/documents` - Document Management
- `/messages` - Messaging Center

### Lawyer Routes
- `/lawyer-dashboard` - Main Dashboard
- `/lawyer-dashboard/cases` - Case Management
- `/lawyer-dashboard/clients` - Client Management
- `/lawyer-dashboard/appointments` - Appointment Management
- `/lawyer-dashboard/messages` - Client Messages
- `/lawyer-dashboard/documents` - Document Management
- `/lawyer-dashboard/assistant` - AI Assistant
- `/lawyer-dashboard/profile` - Profile Management

### Admin Routes
- `/admin` - Admin Panel

## 🎨 Styling & Configuration

- **Tailwind CSS** - Main styling engine (`tailwind.config.ts`)
- **PostCSS** - CSS processing
- **Custom Components** - Extensible component library in `src/components/ui/`

## 🔐 Security Features

- Role-based access control (RBAC)
- OTP-based authentication
- Secure messaging system
- Protected document storage
- User profile privacy controls

## 📱 Responsive Design

The application is fully responsive and includes:
- Mobile-optimized navigation
- Touch-friendly interface
- Adaptive layouts for all screen sizes
- Dedicated mobile bottom navigation

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
- Check the `/help` page for support documentation
- Visit the `/contact` page to reach out
- Review the `/faq` page for common questions

## 🚦 Development Notes

- The project uses ESLint for code quality - run `bun run lint` before committing
- TypeScript strict mode is enabled for type safety
- React Router v6 is used for routing
- Context API + TanStack Query for state management
