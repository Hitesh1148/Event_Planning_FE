import { config } from '../config';

export interface VenueDetail {
  id: string;
  name: string;
  address: string;
  category: string;
  priceTier: string;
  estimatedCostPerPerson: number;
  rating: number;
  status: 'CONFIRMED' | 'UNVERIFIED' | 'UNAVAILABLE';
  photoUrl?: string;
  mapsUrl?: string;
  source: 'DEMO' | 'GOOGLE_PLACES';
}

export const DEMO_VENUES: VenueDetail[] = [
  {
    id: 'venue-rcity',
    name: 'R-City Courtyard Bistro',
    address: 'LBS Rd, Ghatkopar West, Mumbai',
    category: 'Italian & Continental',
    priceTier: '$$',
    estimatedCostPerPerson: 35,
    rating: 4.6,
    status: 'CONFIRMED',
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    mapsUrl: 'https://maps.google.com/?q=R-City+Mall',
    source: 'DEMO'
  },
  {
    id: 'venue-viviana',
    name: 'Viviana Rooftop Grill',
    address: 'Eastern Express Highway, Thane West',
    category: 'Barbeque & Craft Brews',
    priceTier: '$$$',
    estimatedCostPerPerson: 55,
    rating: 4.8,
    status: 'CONFIRMED',
    photoUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    mapsUrl: 'https://maps.google.com/?q=Viviana+Mall',
    source: 'DEMO'
  },
  {
    id: 'venue-phoenix',
    name: 'Phoenix Grand Arcade & Eatery',
    address: 'Kurla West, Mumbai',
    category: 'Pan-Asian & Arcade Gaming',
    priceTier: '$$',
    estimatedCostPerPerson: 42,
    rating: 4.4,
    status: 'UNVERIFIED',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    mapsUrl: 'https://maps.google.com/?q=Phoenix+Marketcity',
    source: 'DEMO'
  }
];

export class VenueService {
  public static async getVenues(): Promise<VenueDetail[]> {
    // If Google Places API key is configured, could query live Google Places API.
    // Otherwise return verified demo venues with clear labeling
    return DEMO_VENUES;
  }

  public static async getVenueById(id: string): Promise<VenueDetail | undefined> {
    return DEMO_VENUES.find(v => v.id === id);
  }
}
