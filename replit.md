# RegisFlow

## Overview
RegisFlow is a comprehensive web application for managing and tracking fireworks sales in compliance with French regulations. It provides a secure system for sales registration with multi-user authentication, role-based access control, multi-store management, and secure PostgreSQL database storage. The application aims to streamline sales operations for fireworks retailers while ensuring regulatory compliance, offering a robust solution for tracking, reporting, and data management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with shadcn/ui and Radix UI primitives
- **State Management**: React Hook Form, TanStack Query
- **Authentication**: Session-based with role-based access control
- **UI/UX Decisions**: Modern, angular design with a professional color scheme, focusing on clear visual borders and frames. Elements like cards, buttons, and form fields use rectangular shapes with a 4px border-radius. Responsive design is prioritized for mobile, tablet, and desktop.

### Backend
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: bcrypt password hashing, Express sessions, PostgreSQL session store
- **Key Features**:
    - Multi-User and Store Management: Secure login, administrative user/store management, multi-tenant store isolation.
    - Sales Management: Comprehensive sales form with validation (including EAN-13), sales history with search/filter, and data export (CSV/Excel with images).
    - Data Compliance: Automated data purge for records older than 19 months, role-based permissions (Admin, Manager, Employee), and secure session management.
    - Backup & Recovery: Full database backup/restore with automatic scheduling and cleanup.
    - Photo Capture: Integrated photo capture for identity documents and receipts with robust camera support and file upload fallback.

### Data Storage
- **Primary Storage**: PostgreSQL database with Drizzle ORM for schema management and migrations.
- **Session Storage**: PostgreSQL sessions table.
- **Multi-tenant**: Each store maintains isolated sales data.
- **Data Flow**: Secure authentication and session management; sales recording with comprehensive validation and audit trails; robust data management with role-based access and secure session handling.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: PostgreSQL database connectivity
- `drizzle-orm`: Type-safe database operations
- `@tanstack/react-query`: Server state management
- `react-hook-form`: Form handling and validation
- `@hookform/resolvers`: Form validation resolvers

### Authentication & Security
- `bcryptjs`: Password hashing
- `express-session`: Session management
- `connect-pg-simple`: PostgreSQL session store
- `drizzle-zod`: Schema validation with Zod

### UI and Styling
- `@radix-ui/*`: Headless UI primitives
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `lucide-react`: Icon library

### Development Tools (used for project development, not runtime dependencies for deployed app)
- `tsx`: TypeScript execution
- `esbuild`: JavaScript bundler
- `vite`: Development server and build tool