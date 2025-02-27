# MERN Stack Project Guidelines

## Build/Run Commands
- Setup: `npm run setup` - Install all dependencies
- Start full app: `npm run start` - Run frontend and backend concurrently
- Start frontend only: `cd frontend && npm run start`
- Start backend only: `cd backend && npm run dev`
- Build frontend: `npm run build-frontend`
- Test frontend: `cd frontend && npm run test`
- Test specific component: `cd frontend && npm test -- -t "ComponentName"`

## Code Style Guidelines
- **TypeScript**: Use strict typing in frontend (TSX files)
- **Naming**: Use camelCase for variables/functions, PascalCase for components/classes
- **Components**: Create functional components with React hooks
- **State Management**: Use Redux toolkit for global state
- **Error Handling**: Use try/catch with specific error messages
- **CSS/Styling**: Use MUI components and styled-components
- **API Calls**: Organize in api/ directory with Redux toolkit RTK Query
- **Form Validation**: Use react-hook-form with yup for schema validation
- **Models**: Use mongoose schemas with validation in backend
- **Routes**: Organize backend routes by resource
- **Authentication**: JWT token-based with middleware protection