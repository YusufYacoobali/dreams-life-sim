import type { World } from '../model';
import type { DramaticEffect } from '../systems/dramaticSchemas';
import { fullName } from '../personHelpers';
import { formatMoney } from '../money';
import { countries } from '../countries';
import { relationFor } from '../systems/relationshipQueries';

type Payoff = { title: string; body: string; journal: string };
/** Copy only. Domain handlers have already recorded the outcome and consumed
 * their normal draws. Older bound choices never enter this revision. */
export function dramaticPayoff(world: World, effect: DramaticEffect, original: Payoff): Payoff {
  const player = world.people[world.activePersonId], choice = effect.choiceId;
  const name = (id: string | undefined) => id && world.people[id] ? fullName(world.people[id]) : 'They';
  const money = (amount: bigint) => formatMoney({ minor: amount, currency: countries[player.country].currency });
  const done = (title: string, body: string, journal: string): Payoff => ({ title, body, journal });
  if (effect.eventId === 'dramatic-boss-criminal') {
    if (choice === 'report') return done('Management is unavailable', `${name(effect.subjectId)} is arrested for corruption. They wanted discretion; you supplied a witness statement. The court gets the next word.`, `I reported ${name(effect.subjectId)}'s corruption confession. They were arrested.`);
    const amount = money(effect.quote! * (choice === 'blackmail' ? 2n : 1n));
    return choice === 'blackmail'
      ? done('A promotion to accomplice', `${name(effect.subjectId)} pays you ${amount}. You have doubled the hush money and given investigators a much more interesting motive.`, `I blackmailed ${name(effect.subjectId)} for ${amount}. The payment became part of an unresolved corruption incident.`)
      : done('Paid to know better', `${name(effect.subjectId)} transfers ${amount}. The bank calls it a deposit. An investigator may choose a different word.`, `I took ${amount} from ${name(effect.subjectId)} to keep quiet about corruption. An investigation can still follow.`);
  }
  if (effect.eventId === 'dramatic-double-fiance' || effect.eventId === 'dramatic-dating-profile') {
    const partner = name(effect.contextId), edge = relationFor(world, player.id, effect.contextId!);
    const ending = edge?.romance === 'ex' ? ' The relationship is over.' : edge?.romance === 'married' ? ' You are still married. This was not a divorce.' : ' You are still together, with less reason to be.';
    if (effect.eventId === 'dramatic-double-fiance') {
      if (choice === 'end') return done('One less booking', `You end the engagement to ${partner}. Their wedding calendar has finally become easier to manage.`, `I ended my engagement to ${partner} after discovering the other proposal.`);
      if (choice === 'dinner' && effect.ruleVersion === 2) {
        const memory = edge?.memories.filter(item => item.startsWith('double-engagement-dinner:')).at(-1);
        const other = memory?.slice('double-engagement-dinner:'.length);
        return done('The couples menu', `You and ${name(other)} compare matching rings over dinner. Both engagements end before dessert. You leave with a new friend; ${partner} leaves with the same problem twice.`, `I met ${name(other)} at the double-engagement dinner. We became friends and both ended our engagements to ${partner}.`);
      }
      return done(choice === 'dinner' ? 'Three places, no trust' : 'A scheduling conflict', (choice === 'dinner' ? `You invite both fiancés. ${partner} suddenly has concerns about the guest list.` : `${partner} tries explaining how two proposals happened. The explanation does not improve with detail.`) + ending, `I confronted ${partner} about the other engagement.${ending}`);
    }
    const opening = choice === 'admit' ? `You admit the profile is yours. ${partner} asks which part of “recently freed” you would like to demonstrate.` : choice === 'old' ? `${partner} points at the recent photo. You explain that the profile is old in spirit.` : `You accuse ${partner} of snooping. They ask whether the whole dating app was snooping too.`;
    return done(choice === 'admit' ? 'A very current problem' : choice === 'old' ? 'Vintage dishonesty' : 'The wrong counterargument', opening + ending, `${choice === 'admit' ? 'I admitted to ' + partner + ' that the dating profile was mine' : choice === 'old' ? 'I told ' + partner + ' my current dating profile was old' : 'I accused ' + partner + ' of snooping after they found my dating profile'}.${ending}`);
  }
  if (effect.eventId === 'dramatic-best-friend-secrets') {
    const friend = name(effect.relatedId);
    return choice === 'forgive'
      ? done('Premium access revoked', `${friend} is still your best friend. You forgive them, then discover you have absolutely nothing you want to tell them.`, `I forgave ${friend} for selling my messages. We stayed best friends, with much less trust.`)
      : choice === 'expose'
        ? done('Two terrible sources', `You publish ${friend}'s secrets and end the friendship. The gossip account now has twice the material. Your image takes the hit too.`, `I exposed ${friend}'s secrets and ended our friendship. My public image suffered.`)
        : done('Subscription cancelled', `You end the friendship with ${friend}. They ask if you can talk about it. You ask what the conversation would retail for.`, `I ended my friendship with ${friend} after they sold my private messages.`);
  }
  if (effect.eventId === 'dramatic-child-exam-scam') {
    const child = name(effect.subjectId);
    return choice === 'praise'
      ? done('Proud investor, terrible parent', `${child} beams at your approval. You have encouraged the fraud without earning a penny from it.`, `I praised ${child}'s fake exam-paper scheme. Our bond improved and their discipline fell.`)
      : choice === 'report'
        ? done('The head office finds out', `You tell the school about ${child}'s fake papers. They stop leaving the spreadsheet open around you. The school has not issued a ruling.`, `I reported ${child}'s fake exam papers to the school. They became more disciplined, stressed and less trusting of me.`)
        : done('Hostile parental takeover', `You make ${child} close the pitch. They call you bad for business and take the entire company into a sulk.`, `I made ${child} stop pitching fake exam papers. They gained discipline and lost patience with me.`);
  }
  if (effect.eventId === 'dramatic-courtroom-defence') {
    const item = world.cases.find(row => row.id === effect.subjectId)!;
    const opening = choice === 'guilty' ? 'You plead guilty and give your lawyer one fewer surprise.' : choice === 'fight' ? 'You fight the charge. Confidence gets a full hearing.' : 'You let your lawyer ask for leniency. For once, you do not improvise.';
    return item.status === 'acquitted'
      ? done('Free to stop talking', `${opening} The verdict is not guilty; any held bail is returned. You leave before confidence can file an appeal.`, `I was acquitted at my hearing. Any held bail was returned.`)
      : done('The court is not persuaded', `${opening} Guilty: ${item.sentenceMonths} months and a ${formatMoney(item.fine)} fine. Remand credit still applies; unpaid fines become debt.`, `I was convicted: sentence ${item.sentenceMonths} months, fine ${formatMoney(item.fine)}, with remand credit applied.`);
  }
  if (effect.eventId === 'dramatic-cellmate-escape') {
    const sentence = world.sentences.find(row => row.id === effect.subjectId)!;
    if (choice === 'join') return sentence.state === 'escaped'
      ? done('Outside, technically', 'The napkin gets you out. You are now wanted, with the remaining sentence paused and a fresh escape record to explain.', 'I escaped from prison. I became wanted and my remaining sentence was paused.')
      : done('The door declines', 'The escape fails. Your original sentence continues, your behaviour record worsens, and a new escape charge is waiting for its turn.', 'My escape attempt failed. I remained imprisoned with a new case awaiting a hearing.');
    return choice === 'report'
      ? done('The napkin changes departments', 'You hand over the plan. Your behaviour record improves, your prison contact stops sharing, and nobody takes a day off your sentence.', 'I reported an escape plan. My behaviour record improved and my prison contact trusted me less.')
      : done('No vacancy for a decoy', 'You decline to test the locked door. Your contact looks disappointed to be doing their own terrible planning.', 'I refused to join my prison contact’s escape plan. No escape was attempted.');
  }
  if (effect.eventId === 'dramatic-accomplice-wire') {
    return choice === 'walk'
      ? done('Leaving the group chat', 'You leave the gang. Unfortunately, the unresolved robbery does not leave with you.', 'I left the gang. The unresolved robbery remained open to investigation.')
      : choice === 'confront'
        ? done('Audio difficulties', 'You ask about the buzzing shirt. They call you paranoid; your standing in the gang drops along with their trust. The robbery is still unresolved.', 'I confronted my gang contact about a suspected wire. My standing and their trust fell.')
        : done('Excellent microphone technique', 'You repeat the robbery in helpful detail. The evidence gets stronger and the investigation moves closer. At least the recording should be clear.', 'I kept talking to a suspected informant. The robbery gained evidence and an earlier investigation.');
  }
  if (effect.eventId === 'dramatic-unpaid-employees') {
    return choice === 'invest'
      ? done('Employee of the overdraft', `You put ${money(effect.quote!)} into the company. The wages are still owed until monthly settlement; your savings have simply joined the queue.`, `I contributed ${money(effect.quote!)} to the company. Unpaid wages still await settlement.`)
      : choice === 'cut'
        ? done('A leaner apology', 'You dismiss one worker and stop marketing and owner payouts. The payroll gets smaller. The wages you already owe do not.', 'I dismissed a worker and stopped marketing and owner payouts. Existing unpaid wages remained due.')
        : done('Paid in optimism', 'You ask everyone for another month. Company cash stays exactly where it was; the bills remain due and three consecutive periods of unpaid bills will close the business.', 'I left the business short of cash for another month. The unpaid obligations remained due.');
  }
  if (effect.eventId === 'dramatic-suspicious-property') {
    return choice === 'accept'
      ? done('Basement sold separately from questions', `The buyer pays ${money(effect.quote!)}. The property transfers and fees and any mortgage take their share. You leave the basement question with its new owner.`, `I sold the property for ${money(effect.quote!)} before fees and mortgage settlement.`)
      : choice === 'explain'
        ? done('No further questions answered', 'You ask what happened in the basement. The buyer withdraws rather than elaborate. You keep the property and an excellent reason to check downstairs.', 'I declined a suspicious property offer after asking about the basement. No sale took place.')
        : done('Your basement, your problem', 'You reject the offer. The buyer takes their enormous budget elsewhere; you keep the property and whatever is happening beneath it.', 'I rejected a suspicious property offer and kept my property.');
  }
  if (effect.eventId === 'dramatic-dishonest-sponsor') {
    return choice === 'accept'
      ? done('A cure for credibility', `You sign for ${money(effect.quote!)} per delivered month. Two disclosed fitness posts a month for six months, nothing upfront. Your public image already feels the side effects.`, `I signed the dubious supplement deal at ${money(effect.quote!)} per delivered month: two disclosed fitness posts monthly for six months, with no upfront payment.`)
      : choice === 'expose'
        ? done('Clinical trial by comment section', 'You decline and publish the pitch. People enjoy the divorce cure considerably more without having to buy it. Your image improves.', 'I rejected and exposed the miracle-supplement pitch. My public image improved; I accepted no contract.')
        : done('Not medically divorced', 'You decline. The company will have to find another face for its breakthrough in imaginary medicine.', 'I turned down the miracle-supplement deal without taking payment or posting obligations.');
  }
  if (effect.eventId === 'dramatic-funeral-stream') {
    return choice === 'end'
      ? done('A moment without a sponsor', 'You stop the scheduled broadcasts. Your family appreciates the silence; the existing sponsorship obligations and recorded memorial post remain.', 'I stopped scheduled broadcasts after the memorial advertisement. Existing sponsorship obligations remained.')
      : choice === 'blame'
        ? done('The blame is live too', `${name(effect.relatedId)} says the schedule was approved. Your family gets to watch you argue over who authorised the disrespect. The editor still has their job.`, 'I blamed my editor for the memorial advertisement. My family and editor lost trust in me, and my image suffered.')
        : done('The dead air was preferable', 'You keep broadcasting through the advertisement. Your family notices the priorities. The stream continues; their trust and your image take the damage.', 'I kept broadcasting after the memorial advertisement. My family’s trust and my public image fell.');
  }
  if (effect.eventId === 'dramatic-election-scandal') {
    return choice === 'apologise'
      ? done('An apology to the wallets', 'You apologise without redefining “wallet”. Your image still suffers, but taking responsibility earns some respect. You remain in the race.', 'I apologised for the leaked insult. My image fell but my respect improved; I stayed in the election.')
      : choice === 'deny'
        ? done('Unfortunately, with sound', 'You deny it. Someone plays the recording again, louder. Your image and respect fall; you are still a candidate.', 'I denied the leaked recording. My image and respect fell; I stayed in the election.')
        : done('Bonus campaign material', 'You attack the leaker. The clip now has a sequel, and your image and respect take the larger hit. You remain in the race.', 'I attacked the leaker. My public image and respect fell sharply; I stayed in the election.');
  }
  if (effect.eventId === 'dramatic-athlete-doping') {
    if (choice === 'risk' && effect.ruleVersion === 2) return done('Your bloodstream has a deadline', 'Your contact congratulates you before you have run anywhere. Your sport skill rises and your health takes the hit. The drug check is due next month; a positive result ends the contract and brings a twelve-month professional suspension.', 'I took the banned drugs. My skill rose, my health fell, and a drug check was scheduled for next month.');
    return choice === 'report'
      ? done('A very short supplement review', 'You report the offer. Your career reputation improves, and the contact discovers the downside of having a witness. Your contract continues.', 'I reported a banned-drug offer. My career reputation improved and the contact trusted me less.')
      : choice === 'refuse'
        ? done('Ingredients: your actual body', 'You refuse. Your reputation improves; the contact loses enthusiasm for your bloodstream. The project continues without the shortcut.', 'I refused banned drugs. My career reputation improved and my contract continued.')
        : original;
  }
  if (effect.eventId === 'dramatic-scandal-movie') {
    return choice === 'walk'
      ? done('The part is now vacant', 'You leave acting and the project is cancelled. Your scandal still exists, but rehearsing it is no longer your job.', 'I left acting over the scandal script. My employment ended and the project was cancelled.')
      : choice === 'take'
        ? done('Based on an uncomfortable story', 'You commit and switch your focus to publicity. Your fame rises and your image falls. Research should be unusually straightforward.', 'I committed to the scandal film and focused on publicity. My fame rose and my public image fell.')
        : done('Creative differences, autobiographical edition', 'You demand changes and switch your focus to craft. The project continues; your career reputation takes the hit for being difficult about the recognisable bits.', 'I pushed for changes to the scandal film and focused on craft. My career reputation fell and the project continued.');
  }
  return original;
}
