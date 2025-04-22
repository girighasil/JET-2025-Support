# Educational Platform - Maths Magic Town

A comprehensive online learning platform built with modern web technologies, designed to facilitate educational content delivery, student assessments, and teacher-student interactions.

## Features

- **User Management**
  - Multiple user roles (Admin, Teacher, Student)
  - Authentication and authorization
  - User profiles and avatars

- **Course Management**
  - Create and manage courses with rich content
  - Course categories and modules
  - File attachments and media support
  - Student enrollment tracking

- **Assessment System**
  - Create and manage tests
  - Multiple question types (MCQ, True/False, Fill in blanks, Subjective)
  - Automated scoring
  - Detailed test analytics
  - Support for decimal points in scoring

- **Interactive Features**
  - Doubt sessions with teachers
  - Real-time notifications
  - Student progress tracking
  - Study time monitoring

- **Analytics Dashboard**
  - Comprehensive analytics for admins
  - Student performance metrics
  - Course engagement statistics
  - Test performance analysis

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn/ui components
- React Query for data fetching
- Recharts for analytics visualization
- TipTap for rich text editing
- React Hook Form for form handling
- Zod for validation

### Backend
- Express.js
- Node.js
- TypeScript
- WebSocket support
- Multer for file uploads
- JWT for authentication

### Database
- PostgreSQL (via Neon Database)
- Drizzle ORM
- Connection using @neondatabase/serverless

## Database Schema

The application uses a comprehensive database schema including:

- Users (Authentication & Profiles)
- Courses & Modules
- Tests & Questions
- Enrollments
- Doubt Sessions
- Study Time Tracking
- Notifications

For detailed schema information, refer to `shared/schema.ts`

## API Routes

The application exposes various API endpoints:

- `/api/auth` - Authentication & authorization
- `/api/users` - User management
- `/api/courses` - Course operations
- `/api/tests` - Test management
- `/api/enrollments` - Enrollment handling
- `/api/doubt-sessions` - Doubt session management
- `/api/notifications` - Notification system
- `/api/analytics` - Analytics data
- `/api/files` - File upload & management

## Getting Started

1. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   ```

2. **Database Configuration**
   - Set up DATABASE_URL in environment variables
   - The application uses Neon Database (PostgreSQL)
   - Run migrations: `npm run db:push`

3. **Development**
   ```bash
   # Start development server
   npm run dev
   ```
   The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/          # Frontend React application
├── server/          # Backend Express application
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── scripts/         # Utility scripts
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Update database schema

## Deployment

The application is configured for deployment on Replit with:
- Automatic builds using `npm run build`
- Production server using `npm run start`
- Port 5000 forwarded to 80/443 in production
- Support for environment variables through Replit Secrets

## Contributing

This is an active project. When contributing, please:

- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly

## License

MIT License