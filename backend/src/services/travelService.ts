import { config } from '../config';

export interface TravelEstimateData {
  venueId: string;
  origin: string;
  destination: string;
  durationMinutes: number;
  distanceKm: number;
  estimatedCost: number;
  trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY';
  source: 'DEMO' | 'GOOGLE_ROUTES';
}

const DEMO_TRAVEL_DATA: Record<string, TravelEstimateData> = {
  'venue-rcity': {
    venueId: 'venue-rcity',
    origin: 'Group Center (Powai Hub)',
    destination: 'R-City Courtyard Bistro',
    durationMinutes: 18,
    distanceKm: 5.2,
    estimatedCost: 6.5,
    trafficLevel: 'LOW',
    source: 'DEMO'
  },
  'venue-viviana': {
    venueId: 'venue-viviana',
    origin: 'Group Center (Powai Hub)',
    destination: 'Viviana Rooftop Grill',
    durationMinutes: 38,
    distanceKm: 16.4,
    estimatedCost: 14.0,
    trafficLevel: 'MODERATE',
    source: 'DEMO'
  },
  'venue-phoenix': {
    venueId: 'venue-phoenix',
    origin: 'Group Center (Powai Hub)',
    destination: 'Phoenix Grand Arcade & Eatery',
    durationMinutes: 24,
    distanceKm: 8.1,
    estimatedCost: 9.0,
    trafficLevel: 'LOW',
    source: 'DEMO'
  }
};

export class TravelService {
  public static async getEstimate(venueId: string, origin = 'Group Center'): Promise<TravelEstimateData> {
    if (DEMO_TRAVEL_DATA[venueId]) {
      return DEMO_TRAVEL_DATA[venueId];
    }

    // Default fallback calculation
    return {
      venueId,
      origin,
      destination: 'Venue Location',
      durationMinutes: 30,
      distanceKm: 10,
      estimatedCost: 10,
      trafficLevel: 'MODERATE',
      source: 'DEMO'
    };
  }
}
