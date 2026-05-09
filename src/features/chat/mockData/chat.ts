import type { AdvisorThread } from '../types';

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60000).toISOString();

export const MOCK_THREAD: AdvisorThread = {
  id: 'thread-1',
  advisorName: 'Priya Mehta',
  advisorTitle: 'Senior Property Advisor',
  online: true,
  lastActive: ago(2),
  messages: [
    {
      id: 'm1',
      role: 'advisor',
      text: 'Hello Saurabh! I\'m Priya, your dedicated property advisor. How can I help you find your dream home today?',
      timestamp: ago(180),
      status: 'read',
    },
    {
      id: 'm2',
      role: 'user',
      text: 'Hi Priya! I\'m looking at DLF The Camellias. Can you share the latest floor plans?',
      timestamp: ago(170),
      status: 'read',
    },
    {
      id: 'm3',
      role: 'advisor',
      text: 'Absolutely! I\'ve sent the brochure to your email. We have a few units available in the 5 BHK + Study configuration.',
      timestamp: ago(168),
      status: 'read',
    },
    {
      id: 'm4',
      role: 'user',
      text: 'Great. What are the price ranges for those?',
      timestamp: ago(60),
      status: 'read',
    },
    {
      id: 'm5',
      role: 'advisor',
      text: 'The 5 BHK + Study starts at ₹13.5 Cr. Would you like to schedule a site visit this weekend? I have slots Saturday 11 AM and Sunday 4 PM.',
      timestamp: ago(58),
      status: 'read',
    },
  ],
};
