/** Rendering language only. Callers supply saved facts and decided outcomes. */
export function personReference(firstName:string,role:string) {
  const plain=role==='Engaged'?'partner':role.toLowerCase();
  return plain==='acquaintance'?firstName:plain==='in your care'?firstName+', who is in your care':'your '+plain+', '+firstName;
}
export const sentenceStart = (text:string) => text[0].toUpperCase()+text.slice(1);
export const sentenceSubject = (reference:string) => sentenceStart(reference)+(reference.includes(',')?',':'');

/** A money reply uses the everyday relationship name; the participant already names the person. */
export function moneySupportBody(firstName:string,role:string,outcome:'gift'|'partial'|'refused'|'annoyed',requested:string,offered=requested,available=true) {
  const parent=role==='Father'||role==='Adoptive Father'?'dad':role==='Mother'||role==='Adoptive Mother'?'mum':undefined;
  const partner=role==='Partner'||role==='Spouse'||role==='Engaged';
  const sibling=role==='Brother'||role==='Sister'||role==='Sibling';
  const child=role==='Son'||role==='Daughter'||role==='Child'||role.startsWith('Adopted ');
  const friend=role==='Friend'||role==='Best friend';
  const guardian=role==='Parent'||role==='Guardian';
  const who=parent?'Your '+parent:partner?'Your partner':sibling||child||guardian?'Your '+role.toLowerCase():firstName;
  // Each response describes the committed transfer or refusal. Temperament,
  // affordability, roll and exact amounts are decided by the support system.
  const voice=parent==='dad'?'dad':parent==='mum'?'mum':partner?'partner':sibling?'sibling':child?'child':guardian?'guardian':friend?'friend':'contact';
  const replies:Record<typeof voice,{gift:string;partial:string;refused:string;unavailable:string;annoyed:string}>={
    dad:{gift:'He adds a brief reminder that this is help, not a new income stream.',partial:'He helps with what he can spare, rather than what your request imagined.',refused:'He declines to explain his budget as though you are auditing it.',unavailable:'He cannot stretch his own budget to cover this one.',annoyed:'He has heard enough about what you need and would like a turn to finish a sentence.'},
    mum:{gift:'She sends the help without asking you to perform gratitude in instalments.',partial:'She makes the smaller amount work without pretending it is the whole request.',refused:'She holds the answer at no, even after the hopeful silence.',unavailable:'She has her own costs to cover before anyone else’s.',annoyed:'She cuts the discussion short before your request becomes a presentation.'},
    partner:{gift:'For once, the money conversation ends before either of you needs a second explanation.',partial:'The smaller amount is help, rather than a promise to cover the rest.',refused:'Being together has not made your budgets identical.',unavailable:'Their own bills still need paying.',annoyed:'They would like to feel less like the next available source of cash.'},
    sibling:{gift:'You accept the help without turning it into a sibling competition.',partial:'They can manage part of the request, even if your arithmetic would prefer all of it.',refused:'Being related has failed to count as financial authorisation.',unavailable:'They need what they have for their own expenses.',annoyed:'They object to being treated as the family’s spare wallet.'},
    child:{gift:'You thank them without pretending it was easy to ask.',partial:'You accept the smaller help without asking them to explain every expense.',refused:'You let their answer stand without turning childhood into an invoice.',unavailable:'They need their money for their own life too.',annoyed:'They ask you to stop treating the request as something they owe you.'},
    guardian:{gift:'You accept the practical help without making a speech about it.',partial:'The help is smaller than the request and still real.',refused:'Their answer remains no after the conversation’s hopeful pause.',unavailable:'Their own budget does not have room for this request.',annoyed:'They cut off the discussion before it becomes another round of asking.'},
    friend:{gift:'You thank them before friendship can acquire a customer-service department.',partial:'They offer what they can manage, rather than agree to more than they have offered.',refused:'A good friendship can survive an answer you did not want.',unavailable:'Their budget has problems of its own.',annoyed:'They would like the next conversation to start with something other than money.'},
    contact:{gift:'You accept the help and keep the thank-you shorter than the request.',partial:'The amount is smaller than you asked for, with no promise of the remainder.',refused:'Repeating the amount would not make it a different question.',unavailable:'They cannot cover this request from what they have available.',annoyed:'The discussion ends before you can make a second pitch.'},
  };
  const reply=replies[voice];
  if(outcome==='partial')return who+' gives you '+offered+' instead of '+requested+'. '+reply.partial;
  if(outcome==='annoyed')return who+' is annoyed by your request for '+requested+'. '+reply.annoyed;
  if(outcome==='refused')return who+(available?' says no to ':' cannot spare ')+requested+'. '+(available?reply.refused:reply.unavailable);
  return who+' gives you '+offered+'. '+reply.gift;
}

export function personActionBody(action:'insult'|'distance'|'praise'|'scold'|'ask-permission'|'ask-activity'|'ask-advice'|'ask-help'|'request-gift',reference:string,approved:boolean,
  gift?:{name:string;price:string}) {
  const who=sentenceSubject(reference),object=reference+(reference.includes(',')?',':'');
  switch(action) {
    case 'insult':return who+' hears the insult and stops giving you the benefit of the doubt. You have made your point much harder to like.';
    case 'distance':return 'You ask for some distance from '+reference+'. The conversation ends sooner, and the gap between you is no longer just a feeling.';
    case 'praise':return 'You tell '+object+' what they did well. For once, the explanation contains no hidden “but”.';
    case 'scold':return 'You tell '+object+' firmly what needs to stop. The point gets across, although neither of you enjoys the conversation.';
    case 'ask-permission':return approved?who+' agrees to one free outing together this year. You have permission, which is the part to remember before celebrating.':who+' says no to the outing. Your hopeful pause fails to change the answer.';
    case 'ask-activity':return 'You spend a free local outing with '+reference+'. It is a pleasant change from only talking when somebody needs something.';
    case 'ask-advice':return approved?who+' listens, then points out the part you have been avoiding. You dislike how useful that turns out to be.':who+' is not ready to give advice today. You leave the question alone rather than asking it in a more desperate voice.';
    case 'ask-help':return approved?who+' helps with the chores while you catch your breath. A shared task is less exhausting than explaining why you should manage alone.':who+' cannot help today. You accept the answer without turning the chores into a test of family loyalty.';
    case 'request-gift':return approved&&gift?who+' buys you a '+gift.name.toLowerCase()+' for '+gift.price+'. You own the gift, including its distinctly less romantic upkeep.':who+' declines to buy the gift. You leave with the same possessions and a rather shorter wish list.';
  }
}
