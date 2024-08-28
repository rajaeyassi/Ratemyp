// middleware.ts or middleware.js
import { withClerkMiddleware } from '@clerk/nextjs/server';

export default withClerkMiddleware({
  // Define public routes, including catch-all route for sign-in
  publicRoutes: ['/sign-in/(.*)', '/api/(.*)'],
});
