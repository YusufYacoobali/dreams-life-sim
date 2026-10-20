import { platformContent, type PlatformId, type PostKind } from './social';

const postSubjects: Record<PostKind, string> = {
  photo: 'photo', message: 'message', video: 'video', travel: 'travel post',
  food: 'food post', fitness: 'fitness post', gaming: 'gaming post', humour: 'humour post',
};

/** New incident copy only. The existing post identity chooses words, never an outcome. */
export function publicCriticismCopy(platform: PlatformId, post: { id: string; kind: PostKind; liveMinutes: number }, age: number): { title: string; body: string } {
  const name = platformContent[platform].name;
  const subject = post.liveMinutes > 0 ? 'live stream' : postSubjects[post.kind];
  const question = age < 18 ? 'What will you do?' : 'How will you respond?';
  const versions = [
    { title: 'A rough reception', body: 'Your ' + subject + ' on ' + name + ' has drawn criticism.' },
    { title: 'A post draws criticism', body: 'Some responses to your ' + subject + ' on ' + name + ' are critical.' },
    { title: 'The reaction turns critical', body: 'People are criticising your ' + subject + ' on ' + name + '.' },
    { title: 'An awkward reaction', body: 'Your ' + subject + ' is getting critical responses on ' + name + '.' },
    { title: 'Criticism on ' + name, body: 'Your ' + subject + ' has attracted criticism on ' + name + '.' },
  ];
  // A checksum of the already-created ID has no dependency on mutable state or RNG.
  const index = [...post.id].reduce((sum, letter) => (sum + letter.charCodeAt(0)) % versions.length, 0);
  const copy = versions[index];
  return { title: copy.title, body: copy.body + '\n\n' + question };
}
