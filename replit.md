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
- ✅ Fixed critical admin user permissions bug preventing profile modifications
- ✅ Added server-side protection against accidental admin role changes
- ✅ Enhanced UI with disabled role field for self-editing administrators
- ✅ Improved admin interface - "Tous" displayed for admin store access, no redundant store selector for admin profiles
- ✅ Cleaned up new sale page interface by removing unnecessary store information display
- ✅ Streamlined dashboard layout for better user experience
- ✅ Made "Lieu de naissance" field mandatory in new sale form for regulatory compliance
- ✅ Removed unnecessary header section from new sale form for cleaner interface
- ✅ Created custom favicon with fireworks design representing RegisFlow application
- ✅ Implemented modern UI template with angular design elements replacing rounded components
- ✅ Updated color scheme to use darker, more professional tones with less vibrant gradients
- ✅ Modified card layouts, buttons, and form elements to use rectangular shapes instead of rounded corners
- ✅ Enhanced Dashboard with clean, professional navigation tabs using bottom borders instead of rounded active states
- ✅ Simplified login page with modern, angular design maintaining accessibility and usability
- ✅ Removed remaining rounded elements from SalesHistory filter cards and form inputs
- ✅ Updated NewSaleForm with modern-input class for all form fields
- ✅ Applied modern-section and modern-card classes throughout the application
- ✅ Replaced all rounded UI elements with straight-edged, angular modern design

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

### Modern UI Design & Advanced Search (January 10, 2025)
- ✅ Complete UI redesign with modern, elegant design system
- ✅ Enhanced visual borders and frames throughout the application for better visibility
- ✅ Colored sections with animations and smooth transitions
- ✅ Made "autorité de délivrance" field optional in new sale form as requested
- ✅ Added comprehensive search module in sales history with multi-field filtering
- ✅ Real-time search across names, sellers, articles, codes, payment methods, and birth places
- ✅ Added CSV export functionality alongside existing PDF export
- ✅ Visible section frames around each category in new sale form
- ✅ Enhanced cards and containers with stronger visual borders
- ✅ Improved responsive design for mobile and tablet devices
- ✅ Modern search interface with clear result counting and active search indicators
- ✅ Dual export options (PDF and CSV) for regulatory compliance reporting
- ✅ Enhanced save button with more prominent green color for better visibility
- ✅ Added visible solid background colors to each form category (vendor, product, client, identity)
- ✅ Removed section borders for cleaner design with color-coded backgrounds
- ✅ Added border to reset button for better visibility
- ✅ Optimized border thickness for better balance between visibility and aesthetics
- ✅ Removed manual date field from new sale form - timestamp now automatically recorded
- ✅ Automatic date/time creation ensures accuracy and prevents manual entry errors
- ✅ Added date and time display in sales history with automatic timestamp from database
- ✅ Harmonized color scheme in new sale form with softer, complementary colors
- ✅ Updated section backgrounds to work cohesively with green save button
- ✅ Uniformized export buttons with consistent styling
- ✅ Applied angular design with reduced border-radius throughout entire application
- ✅ Modern, crisp appearance with 4px border-radius for cards, inputs, and buttons
- ✅ White background for all input fields for better contrast and readability

### Photo Capture System & Tablet Support (January 11, 2025)
- ✅ Restored complete photo capture functionality for identity documents (recto/verso)
- ✅ Added photo download capability from sales history modal with structured filenames
- ✅ Enhanced camera support for tablets with advanced constraint handling
- ✅ Multi-fallback camera system: environment → user → basic video for maximum compatibility
- ✅ Optimized video resolution for tablets (1280x720 ideal, up to 1920x1080)
- ✅ Added visual framing overlay to help users position identity documents correctly
- ✅ Improved CameraModal with better responsive design for tablet screens
- ✅ Enhanced error handling with device-specific camera availability checks
- ✅ Camera permission detection and clear error messages for troubleshooting
- ✅ Support for both front and rear cameras on tablets and mobile devices
- ✅ Camera diagnostic system with detailed test functionality
- ✅ File upload fallback when camera access fails
- ✅ Comprehensive error handling with specific messages for different failure types
- ✅ HTTPS requirement detection for secure camera access
- ✅ Multiple capture methods: camera → file upload for maximum compatibility
- ✅ Added receipt/ticket photo capture as third photo type alongside identity documents
- ✅ PayloadTooLargeError resolved by increasing server limit to 10MB for photo uploads
- ✅ Complete photo management system with separate sections for identity and receipt photos
- ✅ Enhanced SaleDetailsModal with organized photo display and download functionality
- ✅ **CRITICAL FIX**: Photo ticket functionality completely debugged and operational
- ✅ **API Routes**: Fixed camelCase to snake_case mapping (photoTicket → photo_ticket)
- ✅ **Frontend**: Corrected NewSaleForm.tsx to include photoTicket in submission data
- ✅ **Database**: Verified photo_ticket column exists and stores data correctly
- ✅ **MAJOR FIX**: Resolved photo display in exports by correcting column mapping in getSalesByStore()
- ✅ **Excel Export**: Enhanced with dedicated Photos sheet containing actual photo data links
- ✅ **Production Ready**: All photo capture and export systems tested and validated for deployment
- ✅ **UI Cleanup**: Removed "(optionnel)" text from ticket photo label for cleaner interface
- ✅ **Camera System Enhanced**: Improved error handling and fallback mechanisms for photo capture
- ✅ **Default Quantity Fix**: Set default product quantity to "1" in all forms and functions

### Production Deployment System (January 11, 2025)
- ✅ Complete production deployment configuration with Docker Compose
- ✅ Production-optimized Dockerfile with multi-stage builds and security hardening
- ✅ Health check endpoints for monitoring and load balancer integration
- ✅ Resource limits and logging configuration for production containers
- ✅ Persistent volume management for data persistence and backups
- ✅ Production security features: non-root user, secure cookies, session management
- ✅ Replit Deployment integration ready for one-click production deployment
- ✅ Photo capture system fully integrated with database storage
- ✅ Modal de détails des ventes opérationnel avec support complet des photos
- ✅ API et schéma de base de données synchronisés pour la production
- ✅ Bug critique corrigé : mapping camelCase/snake_case pour photo_ticket
- ✅ NewSaleForm.tsx corrigé pour inclure photoTicket dans la soumission
- ✅ API routes.ts corrigé avec mapping automatique des photos
- ✅ **Production Cleanup**: Removed all unnecessary deployment files and debug code
- ✅ **Clean Architecture**: Simplified to essential files only (Dockerfile, docker-compose.yml, init.sql)
- ✅ **Debug Removal**: All debug logs and temporary files cleaned for production
- ✅ RegisFlow prêt pour déploiement en production avec toutes les fonctionnalités

### Production-Ready Excel Export with Images (January 11, 2025)
- ✅ **CRITICAL FIX**: Excel export completely rebuilt with ExcelJS supporting embedded images
- ✅ **Images in Excel**: Photos now directly embedded in Excel cells within the "Photos" worksheet
- ✅ **Schema Consistency**: Corrected all snake_case/camelCase mappings between database and frontend
- ✅ **Database Integrity**: Full production readiness verification completed
- ✅ **Data Validation**: 15 sales, 17 products, 5 users - all data integrity checks passed
- ✅ **Security Verified**: Default admin password changed, proper role distribution confirmed
- ✅ **Production Ready**: All export functionalities operational with real database photos
- ✅ **Excel Images**: Photos from sales (recto, verso, ticket) properly displayed in Excel export files

### Production Deployment System 2025 Update (January 19, 2025)
- ✅ **Complete Docker Configuration Overhaul** : Updated to Node.js 20 and PostgreSQL 16
- ✅ **Enhanced Security** : Implemented non-root containers, security constraints, and resource limits
- ✅ **Multi-stage Dockerfile** : Optimized build process with separate build and production stages
- ✅ **Advanced Health Checks** : Comprehensive monitoring with detailed status endpoints
- ✅ **Production Environment** : Created `.env.production.example` with all security variables
- ✅ **Automated Deployment** : Enhanced docker-entrypoint script with improved error handling
- ✅ **Resource Management** : Memory and CPU limits for optimal server performance
- ✅ **Network Security** : Updated to use nginx_default network for reverse proxy integration
- ✅ **Comprehensive Documentation** : Created DEPLOYMENT_GUIDE.md with complete setup instructions
- ✅ **Environment Validation** : Enhanced startup scripts with database connection verification
- ✅ **Security Hardening** : SCRAM-SHA-256 authentication, secure cookies, and session management
- ✅ **Backup Integration** : Production-ready backup system with automatic retention policies
- ✅ **Monitoring Ready** : Complete logging and health check system for production monitoring

### Docker Production Fixes & Complete Resolution (January 19, 2025)
- ✅ **CRITICAL FIX**: Resolved "docker-entrypoint.sh: No such file or directory" error
- ✅ **Script Inline**: Created start script directly in Dockerfile.simple (no file copy issues)
- ✅ **Migration Robustness**: Fixed drizzle-kit dependency and error handling
- ✅ **Graceful Degradation**: Application starts even if migrations fail
- ✅ **Auto-Creation**: Database tables created automatically on first connection
- ✅ **SSL Configuration**: Fixed PostgreSQL SSL errors with sslmode=disable for Docker
- ✅ **Backup Import Fix**: Corrected timestamp conversion in backup import functionality  
- ✅ **Admin Permissions Fix**: Corrected user role 'admin' to 'administrator' for production consistency
- ✅ **Role Middleware Fix**: Updated all admin routes to use 'administrator' role instead of 'admin'
- ✅ **Frontend Role Fix**: Updated Dashboard.tsx canAccessAdmin checks to use 'administrator' role
- ✅ **Production Database Fix**: Corrected admin user role in production database to 'administrator'
- ✅ **Production Issue Identified**: Production uses separate PostgreSQL database with different admin user
- ✅ **SQL Fix Script Created**: Created fix-production-admin.sql to update admin role in production
- ✅ **Production Guide**: Created comprehensive DEPLOYMENT_GUIDE.md with troubleshooting
- ✅ **Environment Templates**: Updated .env.production.example with security defaults
- ✅ **Health Diagnostics**: Added production-ready health checks and monitoring
- ✅ **Multi-stage Build**: Optimized Dockerfile for production performance and security

### Critical Production Fixes - Store Management & Permissions (January 19, 2025)
- ✅ **Store Selection Bug Fixed**: Frontend used 'admin' instead of 'administrator' role check
- ✅ **Sales Creation Fixed**: Ventes now created on selected store instead of default Frouard
- ✅ **API Routes Corrected**: All routes use 'administrator' role consistently
- ✅ **Delete Permissions Fixed**: Sales deletion route corrected from 'admin' to 'administrator'
- ✅ **Admin Store Access Fixed**: Admin users have store_id = NULL for full access
- ✅ **Production Database Corrected**: Applied SQL fixes for user ID 3 (gael) permissions
- ✅ **Complete Store Management**: Admin can select any store, create sales on selected store
- ✅ **Permission Consistency**: All CRUD operations work with standardized 'administrator' role

### Production Issues Resolution (January 23, 2025)
- ✅ **Administration Users List Fixed**: Production administration panel displaying user list correctly
- ✅ **Backup System Operational**: Automatic backup system working with statistics display
- ✅ **Database Permissions Validated**: All admin operations functional after role corrections
- ✅ **Session Management Fixed**: Application restart resolved authentication state issues
- ✅ **Production Stability Confirmed**: All core features operational in production environment
- ✅ **Project Cleanup**: Removed unused fix-* files and cleared attached_assets directory
- ✅ **Complete Cleanup**: Removed all temporary production debug files, migration scripts, and alternative Docker files

### Previous Docker Issues (January 13, 2025)
- ✅ Resolved cache corruption errors during Docker deployment
- ✅ Fixed missing prod-start.js references in Dockerfile and entrypoint scripts
- ✅ Simplified Docker build process to use dist/index.js directly
- ✅ Eliminated temporary compatibility scripts after project cleanup
- ✅ Fixed Node.js 18 import.meta.dirname undefined error with automatic patching
- ✅ Added sed-based patch in docker-entrypoint-simple.sh for production compatibility
- ✅ Production-ready Docker configuration with Node.js 18 compatibility

### Docker Production Deployment Fix (January 9, 2025)
- ✅ Fixed "relation 'users' does not exist" error by adding drizzle-kit to production dependencies
- ✅ Added automatic database migration in docker-entrypoint-simple.sh script
- ✅ Resolved "Could not find build directory /app/public" by copying assets to correct location
- ✅ Updated Dockerfile to copy dist/public to /app/public for serveStatic compatibility
- ✅ Database tables now created automatically on first container startup
- ✅ Complete Docker deployment package ready with all fixes applied

### Portainer Deployment Fix (January 10, 2025)
- ✅ Resolved Docker image pull error "regisflow-regisflow:latest" in Portainer
- ✅ Created local image building solution with "regisflow:latest" tag
- ✅ Generated Portainer-specific stack configuration (portainer-stack.yml)
- ✅ Built automated deployment script (deploy-portainer.sh) for server setup
- ✅ Created comprehensive Portainer deployment guide (PORTAINER_GUIDE.md)
- ✅ Fixed image reference in docker-compose.yml to use local image
- ✅ Configured proper networking and volume management for Portainer stacks

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