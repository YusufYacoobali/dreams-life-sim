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
    { title: 'Everyone has notes', body: 'Your ' + subject + ' on ' + name + ' has drawn criticism. Apparently everyone in the comments is your new manager.' },
    { title: 'The comments have convened', body: 'People are criticising your ' + subject + ' on ' + name + '. The meeting about your personality appears to be open to the public.' },
    { title: 'An audience with complaints', body: 'Your ' + subject + ' on ' + name + ' has attracted critics. They have found time in their day to explain exactly why you spoiled it.' },
    { title: 'A very public disagreement', body: 'Your ' + subject + ' is getting critical responses on ' + name + '. You wanted attention. The complaints department has provided some.' },
    { title: 'Your turn in the comments', body: 'Your ' + subject + ' has attracted criticism on ' + name + '. A surprising number of strangers feel personally let down by you.' },
  ];
  // A checksum of the already-created ID has no dependency on mutable state or RNG.
  const index = [...post.id].reduce((sum, letter) => (sum + letter.charCodeAt(0)) % versions.length, 0);
  const copy = versions[index];
  return { title: copy.title, body: copy.body + '\n\n' + question };
}
