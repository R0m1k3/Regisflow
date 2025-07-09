# Registre des Ventes de Pétards

## Overview

Application web complète de gestion et suivi des ventes de feux d'artifice en conformité avec la réglementation française. L'application fournit un système d'enregistrement des ventes avec authentification multi-utilisateur, contrôle d'accès basé sur les rôles, gestion multi-magasins, et stockage sécurisé en base de données PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: React Hook Form for form handling, TanStack Query for server state
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Authentication**: Session-based authentication with role-based access control

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL via environment variable DATABASE_URL
- **Authentication**: bcrypt password hashing with Express sessions
- **Session Storage**: PostgreSQL session store for scalability

### Data Storage
- **Primary Storage**: PostgreSQL database with complete schema
- **Session Storage**: PostgreSQL sessions table for user authentication
- **Schema Management**: Drizzle migrations for database versioning
- **Multi-tenant**: Each store has isolated sales data

## Key Components

### Core Application Features
1. **Multi-User Authentication**: Secure login system with role-based access control
2. **User Management**: Administrative interface for creating and managing users
3. **Store Management**: Multi-tenant architecture with store isolation
4. **Sales Form Management**: Comprehensive form for recording fireworks sales with validation
5. **Sales History**: Complete transaction history with date filtering and search
6. **Data Export**: CSV export functionality for regulatory reporting
7. **Role-Based Permissions**: Different access levels for Admin, Manager, and Employee roles

### Authentication & Authorization
- **Administrators**: Full access to all features including user/store management
- **Managers**: Sales management and history access, no administration features
- **Employees**: Sales creation and history viewing only
- **Default Account**: admin/admin123 (auto-created on first database setup)

### Technical Components
- **Session Management**: Secure session handling with PostgreSQL storage
- **Form Validation**: Multi-step validation including EAN-13 barcode validation
- **Responsive Design**: Mobile-first approach with tablet and desktop support
- **Toast Notifications**: User feedback system for actions and errors
- **Modal System**: Dialog-based UI for detailed views and confirmations

## Data Flow

### Authentication Flow
1. User accesses application and is redirected to login page
2. Credentials verified against PostgreSQL users table with bcrypt
3. Successful login creates secure session stored in PostgreSQL
4. User role determines available features and access levels
5. Session automatically managed with configurable expiration

### Sales Recording Process
1. Authenticated user fills out comprehensive sales form
2. Form validation ensures regulatory compliance (EAN-13, required fields)
3. Data submitted to backend with user and store association
4. Sales record created in PostgreSQL with complete audit trail
5. Real-time updates to sales history via TanStack Query
6. Export capability for regulatory compliance reporting

### Data Management
- **Database-First**: All data operations use PostgreSQL for consistency
- **Multi-Tenant**: Store-based data isolation for security
- **Role-Based Access**: Different permissions based on user role
- **Session Security**: Secure session management with PostgreSQL storage
- **Audit Trail**: Complete transaction history with timestamps

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **@hookform/resolvers**: Form validation resolvers

### Authentication & Security
- **bcryptjs**: Password hashing for secure authentication
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store
- **drizzle-zod**: Schema validation with Zod integration

### UI and Styling
- **@radix-ui/***: Headless UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Development server and build tool

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: PostgreSQL with auto-initialization of default admin account
- **Authentication**: Session-based with development-friendly settings
- **Build Process**: TypeScript compilation with Vite bundling

### Production Environment
- **Frontend**: Static assets served via Vite build output
- **Backend**: Express.js server bundled with esbuild
- **Database**: PostgreSQL via DATABASE_URL environment variable
- **Sessions**: Secure session storage in PostgreSQL sessions table
- **Environment Variables**: DATABASE_URL, SESSION_SECRET (optional)

### Security Configuration
- **Password Hashing**: bcrypt with appropriate salt rounds
- **Session Security**: HTTP-only cookies with configurable expiration
- **Role-Based Access**: Middleware-enforced permission system
- **CSRF Protection**: Session-based protection against cross-site attacks

### Build Configuration
- **Client Build**: `vite build` generates optimized static assets
- **Server Build**: `esbuild` bundles Express server for deployment
- **Type Checking**: TypeScript compilation ensures type safety
- **Database Setup**: `npm run db:push` for schema deployment
- **Default Account**: Automatic creation of admin/admin123 on first run

### Deployment Features
- **Environment Detection**: Automatic development/production mode switching
- **Asset Optimization**: Bundled and minified production builds
- **Hot Reloading**: Development-only feature for rapid iteration
- **Error Handling**: Comprehensive error boundaries and logging
- **Multi-Tenant Ready**: Store-based data isolation for scalability

## Recent Changes (January 2025)

### Migration to Full-Stack Architecture
- ✅ Migrated from IndexedDB to PostgreSQL database with Drizzle ORM
- ✅ Implemented complete authentication system with bcrypt password hashing
- ✅ Added role-based access control (Administrator, Manager, Employee)
- ✅ Created multi-tenant architecture with store-based data isolation
- ✅ Built administration panel for user and store management
- ✅ Generated default admin account (admin/admin123) for initial setup
- ✅ Updated all components to work with database instead of local storage
- ✅ Added session-based authentication with PostgreSQL session store
- ✅ Implemented comprehensive API with proper validation and error handling