export const platforms = ['photogram', 'videowave', 'streamline', 'lifelink'] as const;
export type PlatformId = typeof platforms[number];
export const postKinds = ['photo', 'message', 'video', 'travel', 'food', 'fitness', 'gaming', 'humour'] as const;
export type PostKind = typeof postKinds[number];
export const platformContent = {
  photogram: { name: 'Photogram', description: 'Photos, everyday moments and visual stories', art: 'camera', preferred: ['photo', 'travel', 'food'] },
  videowave: { name: 'VideoWave', description: 'Video, entertainment and longer stories', art: 'video', preferred: ['video', 'gaming', 'humour'] },
  streamline: { name: 'Streamline', description: 'Live clips, gaming and conversation', art: 'microphone', preferred: ['gaming', 'video', 'message'] },
  lifelink: { name: 'LifeLink', description: 'Messages, ideas and community', art: 'social', preferred: ['message', 'humour', 'photo'] },
} as const;
export const postContent: Record<PostKind, { title: string; description: string; captions: readonly string[] }> = {
  photo: { title: 'Share a Photo', description: 'A moment from your life', captions: ['An ordinary day worth remembering.', 'A little light in an unexpected place.', 'I nearly walked past this. Glad I stopped.'] },
  message: { title: 'Write a Message', description: 'A short update or an idea', captions: ['A small thing I learned this week.', 'Plans changed. I am finding the good in it.', 'A reminder to make time for the people who matter.'] },
  video: { title: 'Share a Video', description: 'A short original clip', captions: ['The finished clip took more attempts than I expected.', 'A small story from an ordinary day.', 'I finally pressed record instead of thinking about it.'] },
  travel: { title: 'Post About Travel', description: 'Share a trip you actually took', captions: ['A view I will remember long after the journey.', 'The best part was the place we found by accident.', 'A few moments from a real change of scenery.'] },
  food: { title: 'Post About Food', description: 'Cooking, meals and small discoveries', captions: ['It looked easier in the recipe.', 'A meal worth putting the phone down for.', 'I would make this again. With fewer dishes.'] },
  fitness: { title: 'Post About Fitness', description: 'Your actual exercise routine', captions: ['Some progress is just showing up again.', 'A little stronger than last time.', 'No dramatic transformation. Just another session.'] },
  gaming: { title: 'Post About Gaming', description: 'A game, a clip or a shared laugh', captions: ['The plan lasted exactly one round.', 'A remarkably elaborate way to lose.', 'A good evening with a very unreliable strategy.'] },
  humour: { title: 'Post Something Funny', description: 'An original joke or everyday absurdity', captions: ['A minor inconvenience has become my entire personality today.', 'I had a plan. The day submitted amendments.', 'An update from the department of questionable decisions.'] },
};
export const sponsorBrands = [
  { name: 'Thread & Tide', category: 'style', topic: 'photo' }, { name: 'NextLevel Games', category: 'gaming', topic: 'gaming' },
  { name: 'Everyday Table', category: 'home', topic: 'food' }, { name: 'Stride Together', category: 'fitness', topic: 'fitness' },
] as const;
