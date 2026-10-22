import type { Href } from 'expo-router';
import type { World } from '../game/model';
import { ageOn } from '../game/personHelpers';
import { rules } from '../game/rules';
import { isConfined } from '../game/systems/legalSchemas';
import { recordingCommitment } from '../game/systems/musicSchemas';
import { campaignCommitment } from '../game/systems/politicsSchemas';
import { serviceCareer } from '../game/systems/serviceSchemas';
import { publicRoyalDuty } from '../game/systems/royaltySchemas';
import { creatorCatalog } from '../game/content/creators';
import type { CareerArtId } from '../assets/CareerArt';
import type { IllustrationId } from '../assets/Illustration';
import type { HealthLegalArtId } from '../assets/HealthLegalArt';
import type { FameBusinessArtId } from '../assets/FameBusinessArt';

export type LifeContext = {
  key: string; label: string; href: Href;
  icon: { kind:'career'; id:CareerArtId } | { kind:'illustration'; id:IllustrationId }
    | { kind:'legal'; id:HealthLegalArtId } | { kind:'business'; id:FameBusinessArtId } | { kind:'profile' };
};
const profile: LifeContext = { key:'profile',label:'Profile',href:'/profile',icon:{ kind:'profile' } };
const careerLabels = { actor:'Acting',model:'Model',athlete:'Sports',musician:'Music',politician:'Politics' } as const;

/** A shortcut to a current commitment. Reading history never starts a career. */
export function resolveLifeContext(world: World): LifeContext {
  const person = world.people[world.activePersonId];
  if (!person || person.died) return profile;
  if (isConfined(world)) return { key:'prison',label:'Prison',href:'/prison',icon:{ kind:'legal',id:'prison' } };

  if (recordingCommitment(world)) return { key:'recording',label:'Music',href:'/music-studio',icon:{ kind:'career',id:'musician' } };
  if (campaignCommitment(world)) return { key:'campaign',label:'Politics',href:'/politics',icon:{ kind:'career',id:'politician' } };
  const service = serviceCareer(world);
  if (service && service.employmentId === person.employment?.id) return {
    key:'service-'+service.kind,label:service.kind === 'astronaut' ? 'Space' : 'Military',
    href:{ pathname:'/service/[kind]',params:{ kind:service.kind } },icon:{ kind:'career',id:service.kind },
  };
  const adult = ageOn(person,world.date) >= rules[person.country].adultAge;
  if (adult && publicRoyalDuty(world)) return { key:'royalty',label:'Royalty',href:'/royalty',icon:{ kind:'career',id:'royalty' } };
  const studios = world.creatorStudios.filter(item => item.personId === person.id && item.status === 'active');
  const studio = studios.find(item => item.focus === 'full-time') ?? studios[0];
  if (studio) return {
    key:'creator-'+studio.kind,label:studio.kind === 'streamer' ? 'Live' : 'Videos',
    href:{ pathname:'/creator-studio/[kind]',params:{ kind:studio.kind } },icon:{ kind:'career',id:creatorCatalog[studio.kind].art },
  };
  const career = world.careers.find(item => item.personId === person.id && item.status === 'active' && item.employmentId === person.employment?.id);
  if (career) return {
    key:'career-'+career.kind,label:careerLabels[career.kind],
    href:career.kind === 'politician' ? '/politics' : { pathname:'/career/[kind]',params:{ kind:career.kind } },
    icon:{ kind:'career',id:career.kind },
  };
  const companies = world.businesses.filter(item => item.ownerId === person.id && item.status === 'active');
  if (companies.length) return {
    key:'business',label:'Business',href:companies.length === 1 ? { pathname:'/manage-business/[id]',params:{ id:companies[0].id } } : '/business',
    icon:{ kind:'business',id:'business' },
  };
  if (person.employment) return { key:'job',label:'Job',href:'/work',icon:{ kind:'illustration',id:'career' } };
  if (['university','trade','graduate'].includes(person.education.stage)) return { key:'studies',label:'Studies',href:'/education',icon:{ kind:'illustration',id:'education' } };
  if (['primary','secondary'].includes(person.education.stage)) return { key:'school',label:'School',href:'/school',icon:{ kind:'illustration',id:'education' } };
  if (adult && person.finance.pensionAnnual === 0n) return { key:'career',label:'Career',href:'/work',icon:{ kind:'illustration',id:'career' } };
  return profile;
}
