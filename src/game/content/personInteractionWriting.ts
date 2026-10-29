/** Rendering language only. Callers supply saved facts and decided outcomes. */
export function personReference(firstName:string,role:string) {
  const plain=role==='Engaged'?'partner':role.toLowerCase();
  return plain==='acquaintance'?firstName:plain==='in your care'?firstName+', who is in your care':'your '+plain+', '+firstName;
}
export const sentenceStart = (text:string) => text[0].toUpperCase()+text.slice(1);
export const sentenceSubject = (reference:string) => sentenceStart(reference)+(reference.includes(',')?',':'');

/** A money reply uses the everyday relationship name; the participant already names the person. */
export function moneySupportBody(firstName:string,role:string,outcome:'gift'|'partial'|'refused'|'annoyed',requested:string,offered=requested,available=true) {
  const parent=role==='Father'||role==='Adoptive Father'?'Dad':role==='Mother'||role==='Adoptive Mother'?'Mum':undefined;
  const partner=role==='Partner'||role==='Spouse'||role==='Engaged';
  const sibling=role==='Brother'||role==='Sister'||role==='Sibling';
  const child=role==='Son'||role==='Daughter'||role==='Child'||role.startsWith('Adopted ');
  const friend=role==='Friend'||role==='Best friend';
  const who=parent?'Your '+parent.toLowerCase():partner?'Your partner':sibling||child||role==='Parent'||role==='Guardian'?'Your '+role.toLowerCase():firstName;
  if(outcome==='partial')return who+' gives you '+offered+' instead of '+requested+'. The budget has spoken.';
  if(outcome==='annoyed')return who+' is not impressed by your request for '+requested+'. '+(parent?'The Bank of '+parent+' is taking a break.':'Best give their wallet a break.');
  if(outcome==='refused')return who+(available?' says no to ':' cannot spare ')+requested+'. '+(parent?'The Bank of '+parent+(available?' is closed today.':' has its limits.'):partner?'Love has a budget too.':friend?'Friendship has its limits, apparently.':sibling||child||role==='Parent'||role==='Guardian'?'Even family banking has its limits.':'That particular bank is closed.');
  return who+' comes through with '+offered+'. '+(parent?'The Bank of '+parent+' is open.':partner?'Love has a generous streak.':friend?'Friendship has excellent customer service.':sibling?'Sibling support, cash edition.':child?'A little help runs both ways.':'A little help goes a long way.');
}

export function personActionBody(action:'insult'|'distance'|'praise'|'scold'|'ask-permission'|'ask-activity'|'ask-advice'|'ask-help'|'request-gift',reference:string,approved:boolean,
  gift?:{name:string;price:string}) {
  const who=sentenceSubject(reference);
  switch(action) {
    case 'insult':return who+' did not appreciate the insult. That was never going to improve things.';
    case 'distance':return 'You asked for some space from '+reference+'. A little breathing room cost you some closeness.';
    case 'praise':return 'You praised '+reference+'. A little encouragement went a long way.';
    case 'scold':return 'You set a firm boundary with '+reference+'. That one was clearly not a compliment.';
    case 'ask-permission':return approved?who+' agreed to one free outing together this year. Ask to go out when you are both ready.':who+' said no to the outing. The outing will have to wait.';
    case 'ask-activity':return 'You went on a free local outing with '+reference+'. Good company, no admission fee.';
    case 'ask-advice':return approved?who+' helped you think things through. Annoyingly, they made sense.':who+' was not ready to talk. You gave them some space.';
    case 'ask-help':return approved?who+' helped with the chores. Your to-do list finally met its match.':who+' could not help today. The chores will have to wait.';
    case 'request-gift':return approved&&gift?who+' bought you a '+gift.name.toLowerCase()+' for '+gift.price+'. It is yours; ongoing upkeep applies.':who+' passed on buying you a gift. Your presence will have to do.';
  }
}
