import { SpeechMode } from '../types';

export interface SampleSpeech {
  id: string;
  title: string;
  mode: SpeechMode;
  targetAudience: string;
  suggestedDurationSeconds: number;
  preview: string;
  transcript: string;
}

export const SAMPLE_SPEECHES: SampleSpeech[] = [
  {
    id: 'comm101-sleep',
    title: 'COMM 101: The 8:00 AM Class Dilemma & Sleep Hygiene',
    mode: 'comm101',
    targetAudience: 'COMM 101 classmates and Professor Vance',
    suggestedDurationSeconds: 120,
    preview: 'A persuasive speech on biological circadian rhythms in college freshmen and classroom attention.',
    transcript: `Good morning everyone, and especially to anyone who, like me, hit snooze four times before dragging themselves to this lecture hall. 

We are often told that college is an endurance test—that surviving on four hours of sleep and cold brew is a badge of honor. But as first-year students, we are facing an invisible epidemic. According to recent neurobiology studies from Stanford, over 70% of first-year undergraduates experience chronic sleep deprivation, directly impairing cognitive recall, emotional regulation, and academic retention.

When we schedule mandatory freshman lectures at 8:00 AM, we are fighting basic circadian biology. In adolescents and young adults, melatonin release peaks several hours later than in adults. It's not laziness; it is physiological chemistry.

Imagine what would happen if our campus shifted foundational freshman seminars to 9:30 AM. Studies from peer universities show average exam scores climbed by 11%, and campus mental health clinic visits dropped significantly.

So today, I urge all of us—and the academic scheduling committee—to rethink the grind culture. Prioritizing rest is not slacking off; it is the most potent academic advantage we have. Thank you.`,
  },
  {
    id: 'icebreaker-engineering',
    title: 'Freshman Seminar: 60-Second Icebreaker Intro',
    mode: 'icebreaker',
    targetAudience: 'Freshman cohort & peer advisors',
    suggestedDurationSeconds: 65,
    preview: 'A warm, engaging personal introduction sharing your background, passions, and dorm aspirations.',
    transcript: `Hi everyone, my name is Alex Rivera, and I'm a first-year biomedical engineering major from San Antonio, Texas. 

Moving 1,200 miles away from home to this campus was honestly terrifying, but walking into the lab on orientation day reminded me why I'm here. In high school, my younger brother broke his arm playing soccer, and watching the orthopedic specialists reconstruct his cast sparked my obsession with prosthetics and biomechanics.

Outside of class, you can usually find me attempting to master homemade sourdough bread in the dorm kitchen, or desperately searching for the best iced latte within walking distance of the library. 

I'm really looking forward to getting to know everyone this semester, studying together for Chem 101, and hopefully surviving our first midterm season intact. Thanks for having me!`,
  },
  {
    id: 'club-pitch-garden',
    title: 'Campus Involvement: Sustainable Campus Garden Pitch',
    mode: 'club-pitch',
    targetAudience: 'Student government allocation board & student body',
    suggestedDurationSeconds: 95,
    preview: 'A high-energy 90-second pitch advocating for campus micro-gardens and fresh produce donations.',
    transcript: `Picture the open grassy courtyard right outside South Quad. Right now, it's just turf grass that gets mowed twice a week. What if that space could feed over 200 food-insecure students each semester?

My name is Maya, and I'm representing the Campus Agroecology Guild. This fall, we are launching the Quad Garden Initiative. With a modest seed grant of $450 from student government, we can install six raised cedar garden beds, organic drip irrigation, and heirloom vegetable seeds.

All produce harvested will be directly transferred to our on-campus food pantry, completely free for any student who needs fresh greens. Furthermore, we'll host weekend planting workshops where freshmen can de-stress, get their hands dirty, and connect with peers outside the lecture hall.

Join us in transforming unused grass into nourishment and community. Vote yes on Initiative 4 tonight. Thank you!`,
  },
  {
    id: 'research-microplastics',
    title: 'Poster Session: Campus Stormwater Microplastics Walkthrough',
    mode: 'research-poster',
    targetAudience: 'Department faculty, graduate judges, and undergraduate peers',
    suggestedDurationSeconds: 110,
    preview: 'A clear, structured walkthrough of an environmental science poster session.',
    transcript: `Welcome everyone to my research poster. Today I'm presenting our preliminary findings on microplastic fiber runoff across campus drainage basins.

Every week, thousands of fleece jackets and synthetic athletic wear are washed in residence hall laundromats. Our question was simple: how much of this synthetic fiber bypasses municipal wastewater filters and enters our local watershed?

Looking at Figure 1 in the top center, we sampled water across four retention ponds over a six-week span. The red bar indicates a spike in polyethylene terephthalate fibers immediately following peak Sunday laundry hours. 

Our data suggests that simple fiber-catching mesh inserts in dormitory washing machines could capture up to 82% of these microplastics before they ever enter the storm drains. 

In conclusion, low-cost behavioral and infrastructure tweaks in student housing can dramatically reduce university environmental footprints. I'd love to answer any questions on our filtration methodology.`,
  },
];
