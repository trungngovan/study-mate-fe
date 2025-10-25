# StudyMate - Find Study Buddies Near You

A modern web application built with Next.js and HeroUI that helps students and learners find study buddies nearby, connect with them, and collaborate on their learning journey.

## 🚀 Features

### Authentication
- User registration and login
- JWT-based authentication
- Protected routes for authenticated users
- Profile management

### Location-Based Discovery
- **Smart Location Caching**: Uses cached location (< 15 min) to minimize permission prompts
- Find learners nearby using geolocation
- Adjustable search radius (1-50 km)
- Real-time location updates when needed
- Privacy-focused location handling
- **Location History**: View and track your location history with statistics
  - Statistics dashboard (total records, date ranges)
  - Detailed location entries with timestamps and accuracy
  - Filter by time period (7/30/90 days)
  - Direct links to view locations on Google Maps
  - Pagination for large history sets

### Connection Management
- Send connection requests with personalized messages
- Accept or reject incoming requests
- View sent and received requests
- Manage active connections
- Connection statistics dashboard

### Profile & Preferences
- Complete user profile with bio, school, and major
- Add and manage subjects (with level and intent: learn/teach/both)
- Set learning goals with target dates
- Customize learning radius preferences
- View location history and statistics

### Dashboard
- Overview of connection statistics
- Quick actions to discover and connect
- View subjects and goals at a glance
- Profile completion tips
- Location permission prompts

## 🛠️ Technologies Used

- **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
- **UI Library**: [HeroUI v2](https://heroui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Package Manager**: [Bun](https://bun.sh/)

## 📋 Prerequisites

- Node.js 18+ or Bun
- Backend API running (see API_DOCUMENTATION.md)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
bun run build
bun run start
```

## 📁 Project Structure

```
study-mate-fe/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Main dashboard
│   ├── discover/            # Find nearby learners
│   ├── connections/         # Manage connections
│   ├── profile/             # User profile & settings
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── providers.tsx        # App providers
├── components/              # Reusable components
│   ├── navbar.tsx           # Navigation bar
│   ├── theme-switch.tsx     # Theme toggle
│   └── ...
├── contexts/                # React contexts
│   └── auth-context.tsx     # Authentication context
├── lib/                     # Utility libraries
│   └── api-client.ts        # API client wrapper
├── types/                   # TypeScript types
│   ├── api.ts               # API type definitions
│   └── index.ts
├── config/                  # Configuration
│   ├── site.ts              # Site configuration
│   └── fonts.ts
└── styles/                  # Global styles
```

## 🔑 Key Features Explained

### Authentication Flow
1. Users can register with email, password, and full name
2. Upon successful registration, users are auto-logged in
3. JWT tokens are stored in localStorage
4. Tokens are automatically refreshed when expired
5. Protected routes redirect unauthenticated users to login

### Discovery Process
1. Users grant location permission
2. App updates user's current location
3. Backend finds nearby learners within specified radius
4. Users can adjust search radius dynamically
5. Send connection requests with personalized messages

### Connection Lifecycle
```
Send Request → Pending → Accept/Reject
                      ↓
                  Connected (Can Message)
```

## 📱 Pages Overview

### Landing Page (/)
- Hero section with feature highlights
- "How it works" guide
- Call-to-action buttons for sign up

### Dashboard (/dashboard)
- Connection statistics
- Quick action buttons
- Location permission prompt
- Subjects and goals overview
- Profile completion tips

### Discover (/discover)
- Search radius slider
- Grid of nearby learners
- Learner cards with profile info
- Send connection request modal

### Connections (/connections)
- Three tabs: Connections, Received, Sent
- Accept/reject pending requests
- View all active connections
- Cancel sent requests

### Profile (/profile)
- Edit basic information
- Manage schools and major
- Add/remove subjects with levels
- Add/remove learning goals
- Customize learning radius

## 🎨 Theming

The app supports light and dark themes using next-themes. Users can toggle between themes using the switch in the navbar.

## 🔒 Security

- JWT-based authentication
- Tokens stored in localStorage
- Automatic token refresh
- Protected API routes
- Input validation on forms

## 📚 API Integration

The frontend integrates with the StudyMate backend API. See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

Key API endpoints used:
- `/api/auth/*` - Authentication
- `/api/discover/nearby-learners/` - Discovery
- `/api/matching/*` - Connections
- `/api/users/location/` - Location updates
- `/api/subjects/`, `/api/goals/` - Data management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Licensed under the [MIT license](./LICENSE).

## 🙏 Acknowledgments

- Built with [HeroUI](https://heroui.com/) - Beautiful React UI components
- Powered by [Next.js](https://nextjs.org/) - The React Framework
- Icons from emoji set

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Happy Learning! 🎓📚**
