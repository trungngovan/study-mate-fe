# StudyMate Frontend

A modern, responsive frontend application for StudyMate - a learning connection platform that helps users find study buddies nearby.

## Overview

StudyMate Frontend is a React-based single-page application (SPA) built with:

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library with Radix UI primitives
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Lucide React** - Icon library
- **Leaflet & react-leaflet** - Interactive mapping

## Project Structure

```
study-mate-fe/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (button, card, input, etc.)
│   │   ├── layout/          # Layout components (Navigation, Sidebar, Layout)
│   │   ├── Toast.tsx        # Toast notification component
│   │   └── LeafletMap.tsx   # Interactive map for learner discovery
│   ├── pages/
│   │   ├── auth/            # Authentication pages (Login, Register)
│   │   ├── DashboardPage    # Main dashboard
│   │   ├── DiscoverPage     # Discover nearby learners
│   │   ├── ConnectionsPage  # Manage connections and requests
│   │   ├── ChatPage         # Real-time messaging
│   │   ├── ProfilePage      # User profile management
│   │   ├── SettingsPage     # Account settings
│   │   ├── StudySessionsPage # Study sessions listing
│   │   └── StudyGroupsPage   # Study groups listing
│   ├── stores/              # Zustand state stores
│   │   └── authStore.ts     # Authentication state management
│   ├── utils/               # Utility functions
│   │   ├── api.ts           # Axios API client with interceptors
│   │   └── cn.ts            # Class name utility
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles with Tailwind
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # This file
```

## Features Implemented

### Authentication
- ✅ Login page with email/password
- ✅ Registration with comprehensive form
- ✅ JWT token management with refresh mechanism
- ✅ Session persistence with localStorage
- ✅ Automatic token refresh on 401 responses

### User Interface
- ✅ Responsive layout with sidebar navigation
- ✅ Desktop and mobile navigation
- ✅ Black-white minimalistic design
- ✅ shadcn/ui components with Tailwind CSS
- ✅ Smooth transitions and animations

### Dashboard
- ✅ Welcome screen with user stats
- ✅ Quick action cards
- ✅ User profile summary
- ✅ Profile edit link

### User Profile & Settings
- ✅ Profile editing (name, bio, major, year)
- ✅ Account information display
- ✅ Password change functionality
- ✅ Privacy level settings
- ✅ Study radius configuration

### Discover & Matching
- ✅ Nearby learners discovery (Grid view)
- ✅ Interactive map visualization (Map view)
- ✅ Learner cards with detailed information
- ✅ Distance-based filtering
- ✅ Connect button functionality
- ✅ Search and radius adjustment
- ✅ Leaflet-based maps with user and learner markers
- ✅ Grid/Map view toggle

### Connections
- ✅ Pending connection requests (sent and received)
- ✅ Accepted connections listing
- ✅ Request acceptance/rejection UI
- ✅ Message connection button
- ✅ Tabbed interface for organization

### Chat & Messaging
- ✅ Conversations list
- ✅ Message history display
- ✅ Message sending functionality
- ✅ Real-time message updates (REST API)
- ✅ Responsive chat layout

### Study Features
- ✅ Study sessions discovery and listing
- ✅ Session type badges (in-person, virtual, hybrid)
- ✅ Study groups discovery
- ✅ Group member count display
- ✅ Group creation and join buttons

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API running on `http://localhost:8000`

### Installation Steps

1. **Clone the repository**
```bash
cd /Users/trungngovan/Repositories/personal-repo/study-mate-fe
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```
VITE_API_URL=http://localhost:8000/api
```

4. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

5. **Build for production**
```bash
npm run build
```

## Design System

### Color Palette
- **Primary**: Black (#000000)
- **Secondary**: Gray (#f5f5f5, #666666)
- **Background**: White (#ffffff)
- **Border**: Light Gray (#e5e5e5)
- **Destructive**: Red (#dc2626)

### Typography
- **Headings**: Bold, black text
- **Body**: Regular, dark gray text
- **Small**: Muted gray for secondary information

### Components
All UI components use shadcn/ui patterns with customization for the black-white theme:
- Button (variants: default, outline, ghost, secondary)
- Card (with header, content, footer sections)
- Input & Textarea (clean, focused borders)
- Badge (for status indicators)
- Dialog (for modals)
- Tabs & DropdownMenu (for navigation)
- Avatar (for user profiles)
- Skeleton (for loading states)

## State Management

### Zustand Store - authStore
Located at `src/stores/authStore.ts`

**State:**
- `user` - Current logged-in user data
- `isAuthenticated` - Authentication status
- `isLoading` - Loading state for async operations
- `error` - Error messages

**Actions:**
- `register(data)` - Register new user
- `login(email, password)` - Login user
- `logout()` - Logout user
- `restoreSession()` - Restore session from localStorage
- `fetchProfile()` - Fetch user profile
- `updateProfile(data)` - Update user profile
- `changePassword()` - Change user password

## API Integration

### API Client
Located at `src/utils/api.ts`

Features:
- Axios instance with JWT interceptor
- Automatic Bearer token injection
- Token refresh mechanism on 401
- Error handling and logging

### API Endpoints Used
- `POST /auth/login/` - Login
- `POST /auth/register/` - Register
- `POST /auth/logout/` - Logout
- `GET /auth/profile/` - Get user profile
- `PATCH /auth/profile/` - Update profile
- `POST /auth/change-password/` - Change password
- `GET /discover/nearby-learners/` - Find nearby learners
- `GET /matching/requests/` - Get connection requests
- `GET /matching/connections/` - Get accepted connections
- `GET /chat/conversations/` - Get conversations
- `GET /chat/conversations/{id}/messages/` - Get messages
- `POST /chat/messages/` - Send message
- `GET /sessions/` - List study sessions
- `GET /groups/` - List study groups

## Responsive Design

The application is fully responsive with:
- **Mobile-first approach** - Built for mobile, scaled up
- **Breakpoints** - Uses Tailwind CSS default breakpoints (sm, md, lg, xl)
- **Navigation** - Hamburger menu on mobile, sidebar on desktop
- **Layouts** - Single column on mobile, multi-column on desktop
- **Touch-friendly** - Large buttons and tap targets

## Key Components

### Layout Components
- `Layout.tsx` - Main layout wrapper with sidebar and nav
- `Navigation.tsx` - Top navigation bar (mobile)
- `Sidebar.tsx` - Side navigation (desktop and mobile)

### Page Components
- `DashboardPage.tsx` - Home/dashboard
- `LoginPage.tsx` - Authentication page
- `RegisterPage.tsx` - Registration page
- `DiscoverPage.tsx` - Browse nearby learners
- `ConnectionsPage.tsx` - Manage connections
- `ChatPage.tsx` - Messaging interface
- `ProfilePage.tsx` - User profile management
- `SettingsPage.tsx` - Account settings
- `StudySessionsPage.tsx` - Study sessions
- `StudyGroupsPage.tsx` - Study groups

### UI Components (shadcn/ui)
- Button
- Card
- Input
- Textarea
- Label
- Dialog
- Dropdown Menu
- Tabs
- Alert
- Badge
- Avatar
- Skeleton

## Error Handling

- **API Errors**: Caught and displayed in forms
- **Auth Errors**: Redirect to login on 401
- **Network Errors**: User-friendly error messages
- **Form Validation**: Client-side validation before submission
- **Loading States**: Loading indicators during async operations

## Next Steps for Development

### Priority Features to Implement
1. **Real-time Chat** - Implement WebSocket integration for real-time messaging
2. **Location Services** - Browser geolocation API integration
3. **Map Integration** - Display nearby users on map
4. **Advanced Search** - Subject filters, availability filters
5. **Notifications** - Toast notifications for events
6. **Image Upload** - Avatar and media uploads
7. **Session Creation** - Create and manage study sessions
8. **Group Management** - Create and manage study groups

### Code Improvements
1. Add comprehensive error boundaries
2. Implement request debouncing for search
3. Add form validation library (Zod/Yup)
4. Implement proper loading states with Suspense
5. Add unit and integration tests
6. Implement proper logging
7. Add analytics tracking
8. Optimize bundle size

### Performance Enhancements
1. Code splitting by route
2. Image optimization
3. Lazy loading for lists
4. Caching strategies for API responses
5. Memoization of components
6. Virtual scrolling for large lists

## Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code quality
npm run lint         # Run ESLint
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When adding new features:
1. Create pages in `/src/pages/`
2. Create components in `/src/components/`
3. Use existing Zustand stores or create new ones in `/src/stores/`
4. Follow the black-white design system
5. Ensure responsive design
6. Add error handling and loading states

## License

Private project for StudyMate.

## Support

For API integration issues, refer to API_DOCUMENTATION.md in the project root.
