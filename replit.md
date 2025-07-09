# RegisFlow

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
8. **Automated Data Purge**: Regulatory compliance with automatic deletion of sales data older than 19 months
9. **Backup & Recovery**: Complete database backup system with import/export capabilities

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

### Docker Deployment
- **Container Strategy**: Multi-stage Docker build for optimized production images
- **Service Architecture**: Docker Compose with PostgreSQL and application containers
- **Database**: PostgreSQL 15 with persistent volumes and automated initialization
- **Direct Access**: Application accessible directly on port 5000
- **Health Monitoring**: Health checks for all services with automatic recovery
- **Volume Management**: Persistent storage for database and backup data
- **Environment**: Complete environment variable configuration with security templates

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

### User Experience Improvements (January 9, 2025)
- ✅ Fixed authentication flow issues with login/logout redirects
- ✅ Replaced native browser confirm() dialogs with modern AlertDialog modals
- ✅ Enhanced deletion confirmations in sales history and administration panels
- ✅ Improved visual feedback with detailed confirmation dialogs showing item details
- ✅ Added proper modal management with shadcn/ui AlertDialog components

### Database Backup & Recovery System (January 9, 2025)
- ✅ Added complete database backup and restore functionality in administration panel
- ✅ Export feature creates comprehensive JSON backups with all data (users, stores, sales)
- ✅ Import feature allows full database restoration with data validation
- ✅ Automatic ID remapping during import to handle database constraints
- ✅ Security measures: passwords excluded from backups, admin account protected during restore
- ✅ User-friendly interface with clear warnings for destructive operations

### Automatic Backup Scheduler (January 9, 2025)
- ✅ Implemented automatic backup system with node-cron running every 12 hours (00:00 and 12:00)
- ✅ Automatic cleanup maintaining only the 10 most recent backups to prevent disk space issues
- ✅ Backup files stored in server/backups/ directory with timestamped filenames
- ✅ Enhanced administration interface showing backup statistics and manual backup creation
- ✅ Real-time backup status monitoring with automatic stats refresh every 30 seconds
- ✅ Initial backup creation on server startup if no backups exist

### Security Improvements (January 9, 2025)
- ✅ Enhanced login page to hide default admin credentials (admin/admin123) once password is changed
- ✅ Added dynamic credential visibility based on whether default password is still in use
- ✅ Security warning displayed when default credentials are shown
- ✅ API endpoint to check default credential status with password hash comparison

### Automatic Data Purge System (January 9, 2025)
- ✅ Implemented automatic purge system for sales data older than 19 months
- ✅ Scheduled purge execution on the 1st of each month at 02:00 (Europe/Paris timezone)
- ✅ Manual purge execution available in administration panel
- ✅ Comprehensive statistics dashboard showing purge-eligible records
- ✅ Regulatory compliance with French fireworks sales data retention requirements
- ✅ Safety confirmation dialogs for manual purge operations
- ✅ Real-time monitoring of data retention status with visual indicators

### Docker Configuration & Cleanup (January 9, 2025)
- ✅ Complete Docker setup optimized for external PostgreSQL database
- ✅ Docker Compose configuration with RegisFlow application only
- ✅ Automated database connection and migration scripts for external PostgreSQL
- ✅ Health checks and proper container orchestration
- ✅ Production-ready configuration with security best practices
- ✅ Persistent volumes for backup data
- ✅ Environment variable configuration with preconfigured PostgreSQL credentials
- ✅ Removed all nginx configuration files and dependencies
- ✅ Cleaned up redundant Docker scripts and deployment files
- ✅ Simplified network configuration without IP presets to avoid conflicts
- ✅ Default Docker bridge network usage for maximum compatibility
- ✅ Ultra-simple installation process with single command: docker-compose up -d
- ✅ Single docker-compose.yml file for all environments (dev, test, production)
- ✅ Eliminated multiple configuration files to reduce complexity
- ✅ Removed unnecessary documentation files and assets
- ✅ Streamlined project structure with only essential files
- ✅ Configured to use nginx_default network for reverse proxy integration

### Node.js 18 Compatibility Fix (January 9, 2025)
- ✅ Resolved TypeError with undefined paths in Node.js 18 production environment
- ✅ Fixed import.meta.dirname compatibility issue in Docker containers
- ✅ Created server/prod-start.js script that replaces import.meta.dirname with static values
- ✅ Modified docker-entrypoint-simple.sh to use compatibility script
- ✅ Script dynamically patches dist/index.js to replace undefined references
- ✅ Added proper environment variables for production Docker deployment
- ✅ Maintained existing vite.ts configuration without breaking changes
- ✅ Created comprehensive Docker test guide with troubleshooting steps
- ✅ Production-ready solution that works with Node.js 18 in Docker containers

### Docker Production Deployment Fix (January 9, 2025)
- ✅ Fixed "relation 'users' does not exist" error by adding drizzle-kit to production dependencies
- ✅ Added automatic database migration in docker-entrypoint-simple.sh script
- ✅ Resolved "Could not find build directory /app/public" by copying assets to correct location
- ✅ Updated Dockerfile to copy dist/public to /app/public for serveStatic compatibility
- ✅ Database tables now created automatically on first container startup
- ✅ Complete Docker deployment package ready with all fixes applied

### Production Deployment System (January 9, 2025)
- ✅ Multi-stage Dockerfile optimized for production with security hardening
- ✅ Production-specific Docker Compose configuration with resource limits
- ✅ PostgreSQL production configuration with performance optimizations
- ✅ Automated production deployment script with security validations
- ✅ Nginx reverse proxy configuration with SSL/TLS and security headers
- ✅ Comprehensive monitoring script for health checks, logs, and statistics
- ✅ Enhanced environment configuration with mandatory security variables
- ✅ Production-ready logging, backup retention, and data persistence
- ✅ Container security hardening with non-root user and resource limits