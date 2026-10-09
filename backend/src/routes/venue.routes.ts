import { Router, Response, Request } from 'express';
import { VenueService, DEMO_VENUES } from '../services/venueService';
import { TravelService } from '../services/travelService';

const router = Router();

// Get venues list
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const venues = await VenueService.getVenues();
    res.json({
      venues,
      mode: 'DEMO',
      disclaimer: 'Venue prices, operating availability, and ratings are demonstration estimates for Mumbai metro area.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve venues.' });
  }
});

// Get travel estimate for venue
router.get('/:venueId/travel', async (req: Request, res: Response): Promise<void> => {
  try {
    const origin = (req.query.origin as string) || 'Group Center';
    const estimate = await TravelService.getEstimate(req.params.venueId, origin);
    res.json({
      estimate,
      disclaimer: 'Travel duration and traffic conditions are simulation values based on local transit patterns.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch travel estimate.' });
  }
});

export default router;
