# Registre des Ventes de Pétards

## Overview

This is a React-based web application for managing and tracking fireworks sales in compliance with French regulations. The application provides a complete sales registration system with photo capture capabilities, data export features, and regulatory compliance tracking. It's built as a single-page application using React with TypeScript, TailwindCSS for styling, and IndexedDB for local data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: React Hook Form for form handling, TanStack Query for server state
- **UI Components**: Radix UI primitives with custom shadcn/ui components

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: Neon Database (PostgreSQL) for production
- **Development**: In-memory storage for development/testing

### Data Storage
- **Primary Storage**: PostgreSQL database via Neon Database service
- **Local Storage**: IndexedDB for offline capabilities and local data persistence
- **Schema Management**: Drizzle migrations for database versioning

## Key Components

### Core Application Features
1. **Sales Form Management**: Comprehensive form for recording fireworks sales with validation
2. **Customer Identity Verification**: Photo capture for ID documents (front/back)
3. **Product Classification**: Categorization system for different fireworks types (F2/F3)
4. **Sales History**: Complete transaction history with search and filtering
5. **Data Export**: CSV export functionality for regulatory reporting
6. **Backup System**: Automatic local backups using IndexedDB

### Technical Components
- **Camera Integration**: Native device camera access for ID photo capture
- **Form Validation**: Multi-step validation including EAN-13 barcode validation
- **Responsive Design**: Mobile-first approach with tablet and desktop support
- **Toast Notifications**: User feedback system for actions and errors
- **Modal System**: Dialog-based UI for camera capture and sale details

## Data Flow

### Sales Recording Process
1. User fills out comprehensive sales form (vendor, product, customer details)
2. Photos captured using device camera for customer ID verification
3. Form validation ensures regulatory compliance
4. Data saved to IndexedDB for immediate access
5. Automatic backup created for data persistence
6. Optional sync to PostgreSQL database for permanent storage

### Data Management
- **Local-First**: All data operations work offline using IndexedDB
- **Progressive Enhancement**: Database integration available for multi-device sync
- **Export Capability**: Data can be exported as CSV for regulatory compliance
- **Backup/Restore**: Built-in backup system for data protection

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **@hookform/resolvers**: Form validation resolvers

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
- **Database**: In-memory storage for rapid development
- **Build Process**: TypeScript compilation with Vite bundling

### Production Environment
- **Frontend**: Static assets served via Vite build output
- **Backend**: Express.js server bundled with esbuild
- **Database**: PostgreSQL via Neon Database service
- **Environment Variables**: DATABASE_URL for production database connection

### Build Configuration
- **Client Build**: `vite build` generates optimized static assets
- **Server Build**: `esbuild` bundles Express server for deployment
- **Type Checking**: TypeScript compilation ensures type safety
- **Database Migrations**: `drizzle-kit push` for schema updates

### Deployment Features
- **Environment Detection**: Automatic development/production mode switching
- **Asset Optimization**: Bundled and minified production builds
- **Hot Reloading**: Development-only feature for rapid iteration
- **Error Handling**: Comprehensive error boundaries and logging