import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'planwise-fallback-secret-2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  googleRoutesApiKey: process.env.GOOGLE_ROUTES_API_KEY || '',
};
