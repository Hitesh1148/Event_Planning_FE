import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PlanWise database seed...');

  // Clean existing records
  await prisma.notification.deleteMany();
  await prisma.decisionHistory.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.itineraryItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.recommendationResult.deleteMany();
  await prisma.recommendationRun.deleteMany();
  await prisma.travelEstimate.deleteMany();
  await prisma.memberBudget.deleteMany();
  await prisma.memberAvailability.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.eventProposal.deleteMany();
  await prisma.eventConstraint.deleteMany();
  await prisma.eventMember.deleteMany();
  await prisma.event.deleteMany();
  await prisma.groupInvitation.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@planwise.local',
      passwordHash,
      name: 'Alice Johnson',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@planwise.local',
      passwordHash,
      name: 'Bob Smith',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    }
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@planwise.local',
      passwordHash,
      name: 'Charlie Davis',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    }
  });

  const dana = await prisma.user.create({
    data: {
      email: 'dana@planwise.local',
      passwordHash,
      name: 'Dana Lee',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    }
  });

  console.log('✅ Seeded 4 demonstration users.');

  // 2. Create Groups
  const weekendCrew = await prisma.group.create({
    data: {
      name: 'Weekend Crew',
      description: 'Close circle for weekend dining, city explorations, and hangouts.',
      inviteCode: 'WEEKEND',
      createdById: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
          { userId: dana.id, role: 'MEMBER' }
        ]
      }
    }
  });

  const techExplorers = await prisma.group.create({
    data: {
      name: 'Tech Explorers',
      description: 'Colleagues & friends planning hackathons, tech meetups, and board game nights.',
      inviteCode: 'TECHEXP',
      createdById: charlie.id,
      members: {
        create: [
          { userId: charlie.id, role: 'ADMIN' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: bob.id, role: 'MEMBER' }
        ]
      }
    }
  });

  console.log('✅ Seeded groups: Weekend Crew & Tech Explorers.');

  // 3. Create Seed Venues
  await prisma.venue.createMany({
    data: [
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
    ]
  });

  // 4. Create Master Showcase Event: "Birthday Dinner"
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + ((6 - nextSaturday.getDay() + 7) % 7 || 7));
  const dateStr = nextSaturday.toISOString().split('T')[0];

  const birthdayEvent = await prisma.event.create({
    data: {
      groupId: weekendCrew.id,
      title: 'Birthday Dinner Celebration',
      description: 'Celebrating Alice’s birthday with food, laughs, and evening dessert!',
      eventType: 'BIRTHDAY',
      organizerId: alice.id,
      status: 'PLANNING',
      selectedDate: dateStr,
      selectedTime: '19:30 - 22:30',
      agreedBudget: 35,
      rsvpDeadline: new Date(Date.now() + 86400000 * 3),
      votingDeadline: new Date(Date.now() + 86400000 * 2),
      members: {
        create: [
          { userId: alice.id, rsvpStatus: 'ATTENDING' },
          { userId: bob.id, rsvpStatus: 'ATTENDING' },
          { userId: charlie.id, rsvpStatus: 'ATTENDING' },
          { userId: dana.id, rsvpStatus: 'MAYBE' }
        ]
      }
    }
  });

  // 5. Member Budgets (Showcasing Bob's strict $40 hard budget!)
  await prisma.memberBudget.createMany({
    data: [
      {
        eventId: birthdayEvent.id,
        userId: alice.id,
        preferredBudget: 35,
        stretchBudget: 45,
        hardLimit: 50,
        notes: 'Comfortable with $35 to $45'
      },
      {
        eventId: birthdayEvent.id,
        userId: bob.id,
        preferredBudget: 30,
        stretchBudget: 40,
        hardLimit: 40, // STRICT: Viviana ($55) will violate this!
        notes: 'Strict student monthly budget limit ($40 max)'
      },
      {
        eventId: birthdayEvent.id,
        userId: charlie.id,
        preferredBudget: 40,
        stretchBudget: 60,
        hardLimit: 75,
        notes: 'Happy to stretch for great food & rooftop vibe'
      },
      {
        eventId: birthdayEvent.id,
        userId: dana.id,
        preferredBudget: 50,
        stretchBudget: 70,
        hardLimit: 80,
        notes: 'Flexible spending'
      }
    ]
  });

  // 6. Member Availabilities
  await prisma.memberAvailability.createMany({
    data: [
      { eventId: birthdayEvent.id, userId: alice.id, date: dateStr, timeSlot: '19:30 - 22:30', status: 'AVAILABLE' },
      { eventId: birthdayEvent.id, userId: bob.id, date: dateStr, timeSlot: '19:30 - 22:30', status: 'AVAILABLE' },
      { eventId: birthdayEvent.id, userId: charlie.id, date: dateStr, timeSlot: '19:30 - 22:30', status: 'AVAILABLE' },
      { eventId: birthdayEvent.id, userId: dana.id, date: dateStr, timeSlot: '19:30 - 22:30', status: 'IF_NEEDED' }
    ]
  });

  // 7. Proposals
  const pRcity = await prisma.eventProposal.create({
    data: {
      eventId: birthdayEvent.id,
      category: 'VENUE',
      title: 'R-City Courtyard Bistro',
      description: 'Relaxed Italian bistro with outdoor seating and excellent artisan pizzas.',
      estimatedCost: 35,
      location: 'Ghatkopar West, Mumbai',
      status: 'ACTIVE',
      createdById: alice.id,
      metadata: JSON.stringify({ venueId: 'venue-rcity' })
    }
  });

  const pViviana = await prisma.eventProposal.create({
    data: {
      eventId: birthdayEvent.id,
      category: 'VENUE',
      title: 'Viviana Rooftop Grill',
      description: 'Lively rooftop BBQ with panoramic sunset terrace. Costs $55/person.',
      estimatedCost: 55, // EXCEEDS BOB'S $40 HARD LIMIT!
      location: 'Thane West, Mumbai',
      status: 'ACTIVE',
      createdById: charlie.id,
      metadata: JSON.stringify({ venueId: 'venue-viviana' })
    }
  });

  const pPhoenix = await prisma.eventProposal.create({
    data: {
      eventId: birthdayEvent.id,
      category: 'VENUE',
      title: 'Phoenix Grand Arcade & Eatery',
      description: 'Asian noodles & bowling arcade combo. Fun but slightly louder.',
      estimatedCost: 42,
      location: 'Kurla West, Mumbai',
      status: 'ACTIVE',
      createdById: bob.id,
      metadata: JSON.stringify({ venueId: 'venue-phoenix' })
    }
  });

  // 8. Votes
  await prisma.vote.createMany({
    data: [
      { proposalId: pRcity.id, userId: alice.id, score: 1, voteType: 'UP' },
      { proposalId: pRcity.id, userId: bob.id, score: 1, voteType: 'UP' },
      { proposalId: pRcity.id, userId: charlie.id, score: 1, voteType: 'UP' },
      { proposalId: pViviana.id, userId: charlie.id, score: 1, voteType: 'UP' },
      { proposalId: pViviana.id, userId: dana.id, score: 1, voteType: 'UP' },
      { proposalId: pViviana.id, userId: bob.id, score: -1, voteType: 'DOWN' },
      { proposalId: pPhoenix.id, userId: bob.id, score: 1, voteType: 'UP' },
      { proposalId: pPhoenix.id, userId: alice.id, score: 1, voteType: 'UP' }
    ]
  });

  // 9. Initial Recommendation Run
  const initialRun = await prisma.recommendationRun.create({
    data: {
      eventId: birthdayEvent.id,
      runById: alice.id,
      inputsSnapshot: JSON.stringify({ algorithm: 'PlanWise Decision Intelligence v1' }),
      results: {
        create: [
          {
            proposalId: pRcity.id,
            score: 88,
            rank: 1,
            isFeasible: true,
            violatedConstraints: JSON.stringify([]),
            positiveFactors: JSON.stringify([
              'Comfortably within every member’s ideal preferred budget ($35/person).',
              'High group popularity: 3 members voted in favor.',
              'Quick transit: approximately 18 mins from group center.'
            ]),
            negativeFactors: JSON.stringify([]),
            explanation: 'Ranked with composite score 88/100. Top compromise satisfying 100% of hard constraints and minimizing group commute.',
            breakdown: JSON.stringify({
              preferenceScore: 75,
              affordabilityScore: 100,
              travelScore: 82,
              trafficScore: 95,
              suitabilityScore: 92
            })
          },
          {
            proposalId: pPhoenix.id,
            score: 74,
            rank: 2,
            isFeasible: true,
            violatedConstraints: JSON.stringify([]),
            positiveFactors: JSON.stringify([
              '2 group member(s) supported this option.',
              'Low traffic route along Kurla bypass.'
            ]),
            negativeFactors: JSON.stringify([
              'Bob must stretch budget slightly ($42 vs $40 ideal).'
            ]),
            explanation: 'Ranked with composite score 74/100. Feasible alternative, slightly higher cost than R-City.',
            breakdown: JSON.stringify({
              preferenceScore: 50,
              affordabilityScore: 78,
              travelScore: 76,
              trafficScore: 95,
              suitabilityScore: 88
            })
          },
          {
            proposalId: pViviana.id,
            score: 38,
            rank: 3,
            isFeasible: false,
            violatedConstraints: JSON.stringify([
              'Hard Budget Exceeded: Exceeds Bob Smith\'s hard limit of $40 by $15.'
            ]),
            positiveFactors: JSON.stringify([
              'Highly rated rooftop venue (4.8/5.0).',
              '2 members strongly voted in favor.'
            ]),
            negativeFactors: JSON.stringify([
              'Violates Bob\'s non-negotiable hard spending limit.',
              'Commute is 38 minutes during Friday evening rush hour.'
            ]),
            explanation: 'Infeasible: Exceeds Bob Smith\'s hard spending limit of $40. Requires either budget relaxation or an explicit group override confirmation.',
            breakdown: JSON.stringify({
              preferenceScore: 25,
              affordabilityScore: 10,
              travelScore: 62,
              trafficScore: 65,
              suitabilityScore: 96
            })
          }
        ]
      }
    }
  });

  // 10. Tasks
  await prisma.task.createMany({
    data: [
      {
        eventId: birthdayEvent.id,
        title: 'Reserve 4-person table under Alice',
        description: 'Call restaurant at 10 AM to confirm outdoor courtyard booth.',
        assignedToId: alice.id,
        deadline: new Date(Date.now() + 86400000 * 2),
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        createdById: alice.id
      },
      {
        eventId: birthdayEvent.id,
        title: 'Order custom chocolate hazelnut cake',
        description: 'Pick up from Theobroma Patisserie at 6 PM on event day.',
        assignedToId: charlie.id,
        deadline: new Date(Date.now() + 86400000 * 3),
        priority: 'URGENT',
        status: 'TODO',
        createdById: alice.id
      },
      {
        eventId: birthdayEvent.id,
        title: 'Confirm carpool pickup points',
        description: 'Coordinate shared cab from Powai junction.',
        assignedToId: bob.id,
        deadline: new Date(Date.now() + 86400000 * 3),
        priority: 'MEDIUM',
        status: 'COMPLETED',
        createdById: alice.id
      }
    ]
  });

  // 11. Itinerary Items
  await prisma.itineraryItem.createMany({
    data: [
      {
        eventId: birthdayEvent.id,
        title: 'Meet at Central Concourse Fountain',
        description: 'Gather group and check in together.',
        startTime: '19:15',
        endTime: '19:30',
        location: 'R-City Main Entrance, Level 1',
        orderIndex: 0,
        notes: 'Bob and Charlie arriving via Powai cab.'
      },
      {
        eventId: birthdayEvent.id,
        title: 'Dinner & Birthday Toast',
        description: 'Seated dinner, pizza ordering, and toast.',
        startTime: '19:30',
        endTime: '21:00',
        location: 'Courtyard Bistro Table #14',
        orderIndex: 1,
        responsibleMemberId: alice.id
      },
      {
        eventId: birthdayEvent.id,
        title: 'Cake Cutting & Outdoor Dessert Walk',
        description: 'Surprise cake reveal and coffee stroll in the courtyard.',
        startTime: '21:00',
        endTime: '22:15',
        location: 'Courtyard Promenade',
        orderIndex: 2,
        responsibleMemberId: charlie.id
      }
    ]
  });

  // 12. Expenses & Splits
  const exp1 = await prisma.expense.create({
    data: {
      eventId: birthdayEvent.id,
      title: 'Bistro Advance Table Deposit',
      description: 'Required reservation deposit to secure courtyard table.',
      category: 'FOOD',
      totalAmount: 60,
      payerId: alice.id,
      date: dateStr,
      splitMethod: 'EQUAL',
      isEstimated: false,
      participants: {
        create: [
          { userId: alice.id, shareAmount: 15 },
          { userId: bob.id, shareAmount: 15 },
          { userId: charlie.id, shareAmount: 15 },
          { userId: dana.id, shareAmount: 15 }
        ]
      }
    }
  });

  const exp2 = await prisma.expense.create({
    data: {
      eventId: birthdayEvent.id,
      title: 'Custom Chocolate Hazelnut Cake',
      description: '1.5 kg celebration cake with candles.',
      category: 'FOOD',
      totalAmount: 39,
      payerId: charlie.id,
      date: dateStr,
      splitMethod: 'EQUAL',
      isEstimated: false,
      participants: {
        create: [
          { userId: alice.id, shareAmount: 13 },
          { userId: bob.id, shareAmount: 13 },
          { userId: charlie.id, shareAmount: 13 }
        ]
      }
    }
  });

  // 13. Decision History Audit Log
  await prisma.decisionHistory.createMany({
    data: [
      {
        eventId: birthdayEvent.id,
        actorId: alice.id,
        actionType: 'EVENT_CREATED',
        entityType: 'Event',
        entityId: birthdayEvent.id,
        details: JSON.stringify({ title: birthdayEvent.title, eventType: birthdayEvent.eventType }),
        timestamp: new Date(Date.now() - 86400000 * 2)
      },
      {
        eventId: birthdayEvent.id,
        actorId: bob.id,
        actionType: 'BUDGET_UPDATED',
        entityType: 'MemberBudget',
        details: JSON.stringify({ userName: 'Bob Smith', hardLimit: 40, note: 'Strict hard limit declared' }),
        timestamp: new Date(Date.now() - 86400000 * 1.5)
      },
      {
        eventId: birthdayEvent.id,
        actorId: charlie.id,
        actionType: 'PROPOSAL_CREATED',
        entityType: 'EventProposal',
        entityId: pViviana.id,
        details: JSON.stringify({ title: pViviana.title, estimatedCost: 55 }),
        timestamp: new Date(Date.now() - 86400000 * 1.2)
      },
      {
        eventId: birthdayEvent.id,
        actorId: alice.id,
        actionType: 'RECOMMENDATION_CALCULATED',
        entityType: 'RecommendationRun',
        entityId: initialRun.id,
        details: JSON.stringify({ topChoice: 'R-City Courtyard Bistro', score: 88 }),
        timestamp: new Date(Date.now() - 86400000 * 0.5)
      }
    ]
  });

  // 14. In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alice.id,
        title: 'New Proposal Added',
        message: 'Charlie Davis added "Viviana Rooftop Grill" ($55/person) to Birthday Dinner.',
        type: 'EVENT_UPDATE',
        link: `/events/${birthdayEvent.id}`,
        isRead: false
      },
      {
        userId: bob.id,
        title: 'Voting Deadline Approaching',
        message: 'Cast your votes on venue proposals for Birthday Dinner before tomorrow evening.',
        type: 'VOTE_REMINDER',
        link: `/events/${birthdayEvent.id}`,
        isRead: false
      },
      {
        userId: charlie.id,
        title: 'Task Assigned',
        message: 'You have been assigned: "Order custom chocolate hazelnut cake".',
        type: 'TASK_DEADLINE',
        link: `/events/${birthdayEvent.id}`,
        isRead: true
      }
    ]
  });

  // 15. Second Event: "Tech Explorers Hackathon & Dinner"
  const hackathonEvent = await prisma.event.create({
    data: {
      groupId: techExplorers.id,
      title: 'Spring Code Jam & Dinner',
      description: 'Collaborative sprint on open source followed by dim sum.',
      eventType: 'OTHER',
      organizerId: charlie.id,
      status: 'PLANNING',
      selectedDate: dateStr,
      selectedTime: '14:00 - 20:00',
      agreedBudget: 25,
      members: {
        create: [
          { userId: charlie.id, rsvpStatus: 'ATTENDING' },
          { userId: alice.id, rsvpStatus: 'ATTENDING' },
          { userId: bob.id, rsvpStatus: 'ATTENDING' }
        ]
      }
    }
  });

  console.log('🎉 PlanWise database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
