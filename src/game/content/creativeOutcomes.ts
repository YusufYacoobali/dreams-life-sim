type Reception = 'cult' | 'crowd' | 'acclaimed' | 'popular' | 'flop' | 'mixed';
type Copy = Record<Reception, string>;
const reception = (critical: number, audience: number, threshold: number): Reception =>
  critical >= threshold && audience < 55 ? 'cult' : critical < 55 && audience >= 65 ? 'crowd' : critical >= threshold ? 'acclaimed' : audience >= 65 ? 'popular' : audience < 42 ? 'flop' : 'mixed';

const actor: Record<string, Copy> = {
  'independent-film': {
    cult: 'The festival crowd loves your performance. Outside the screening room, your most enthusiastic supporter is still the person who sold you a ticket.',
    crowd: 'Audiences embrace the little film the critics dismissed. The discussion afterwards is mostly about whether the critics saw the same ending.',
    acclaimed: 'Your performance gives the festival conversations something worth arguing about. Casting directors have a reason to learn your name.',
    popular: 'The small film finds a much larger audience than its publicity budget could afford. Your face travels further than the borrowed camera.',
    flop: 'The film struggles to find an audience. At one screening, the loudest response comes from somebody opening a packet of crisps.',
    mixed: 'The film earns a few admirers and a few very long objections. Your next audition comes with a more interesting answer to “What have you done lately?”',
  },
  'studio-film': {
    cult: 'The critics praise your work in the studio spectacle. Audiences remain unconvinced that another enormous explosion was necessary.',
    crowd: 'The reviews are brutal. Audiences love it anyway. Critics are beginning to feel left out.',
    acclaimed: 'Your performance survives the explosions and earns strong reviews. For once, the studio can put a quotation on the poster without removing half the sentence.',
    popular: 'The studio campaign finds its audience, and your face becomes part of the attraction. You are now recognisable to people who have never read the credits.',
    flop: 'The publicity is everywhere; the audience is harder to locate. A cardboard version of you stands in a cinema foyer looking more optimistic than anyone else.',
    mixed: 'The studio film draws a mixed response. You get a useful credit and several interviews asking whether the explosions were difficult to act opposite.',
  },
  series: {
    cult: 'Reviewers champion the series. The audience is smaller, but exceptionally committed to explaining why everyone else is wrong.',
    crowd: 'Reviewers call the series ridiculous. Viewers keep watching, quoting your lines and demanding to know what happens next.',
    acclaimed: 'Your work becomes one of the reasons critics recommend the series. There is more to discuss than the final episode’s haircut.',
    popular: 'The series finds loyal viewers, and your performance becomes familiar in living rooms you will never visit.',
    flop: 'The series slips past most viewers. Your dramatic entrance is briefly outperformed by the platform’s autoplay countdown.',
    mixed: 'Some viewers stay for your scenes; others leave extremely detailed comments. The series gives you visibility without settling the argument about your next role.',
  },
  theatre: {
    cult: 'The reviews celebrate your live performance. The empty seats remain impressively unmoved by professional opinion.',
    crowd: 'Audiences respond warmly even as reviewers pick the production apart. You can hear exactly which verdict matters during the curtain call.',
    acclaimed: 'Your work holds up under the lights, night after night. The reviews recognise a performance that could not hide behind another take.',
    popular: 'The live run connects with its audience. You finish with applause in your ears and the unsettling freedom to stop remembering every cue.',
    flop: 'The run ends quietly. During one long pause, you can hear somebody in the back deciding whether to cough.',
    mixed: 'The run has strong nights and awkward silences. You leave with stage experience, a finished credit and a healthy suspicion of dramatic pauses.',
  },
  commercial: {
    cult: 'Industry reviewers admire your performance in the advert. Most viewers remain busy looking for the skip button.',
    crowd: 'The advert gets attention despite unkind industry reviews. Strangers recognise you as the person with an unusually intense relationship with the product.',
    acclaimed: 'Your performance earns professional praise for an advert. You have made an implausibly good case for something sold beside the checkout.',
    popular: 'The advert reaches an eager audience. People recognise your face, although they tend to address you by the product’s name.',
    flop: 'The advert passes most viewers by. You deliver the product’s life-changing promise to an audience apparently content with its existing life.',
    mixed: 'The advert gets a mixed response. Your professional credit survives, along with a slogan you will hear in your sleep.',
  },
};

const model: Record<string, Copy> = {
  runway: {
    cult: 'Fashion reviewers notice your presentation. Outside the room, the collection attracts less attention than the queue for the cloakroom.',
    crowd: 'The walk gets attention while industry reviews stay cool. People remember the entrance; the reviewers would prefer a different exit.',
    acclaimed: 'Your preparation shows on the runway. The presentation earns professional praise without a fastening becoming the main event.',
    popular: 'The runway presentation draws an enthusiastic audience. Your walk travels further than the length of the room.',
    flop: 'The show finishes with little public interest. The most discussed walk belongs to someone leaving early to beat the traffic.',
    mixed: 'The runway response is divided. Your presentation becomes a finished credit rather than an argument you need to win backstage.',
  },
  editorial: {
    cult: 'The editorial earns industry praise. It circulates mainly among people who can identify the photographer from a shadow.',
    crowd: 'Readers love the editorial more than fashion reviewers do. Your photograph gets shared without waiting for professional permission.',
    acclaimed: 'The editorial gives industry reviewers something substantial to praise. Your expression does more work than the furniture around it.',
    popular: 'The editorial finds an enthusiastic readership. Your photographs escape the magazine’s pages and bring new attention to your work.',
    flop: 'The editorial attracts little public attention. The photograph beside an interview about soup receives more discussion.',
    mixed: 'The editorial divides opinion. Your portfolio gains a distinctive piece, even if nobody agrees what the chair was meant to symbolise.',
  },
  advertising: {
    cult: 'The campaign earns industry praise without much public interest. The mood board may have been the campaign’s entire audience.',
    crowd: 'The campaign catches on despite cool industry reviews. The public seems less concerned about whether the concept is terribly original.',
    acclaimed: 'Industry reviewers praise how you carry the advertising brief. You make the product look useful without pretending it can repair a marriage.',
    popular: 'The advertising campaign finds its audience. Your face becomes familiar to people who never intended to follow fashion.',
    flop: 'The campaign struggles to attract attention. You have become the face of something people are managing perfectly well without noticing.',
    mixed: 'The campaign gets a mixed response. You finish the brief with work to show and a client whose next idea may need more questions.',
  },
  designer: {
    cult: 'Industry reviewers admire the collaboration. The wider audience remains smaller than the designer’s collection of fabric samples.',
    crowd: 'The collection finds admirers while fashion reviewers remain doubtful. The designer discovers that useful feedback can arrive without a press pass.',
    acclaimed: 'The designer collaboration earns strong professional reviews. The creative gamble gives your portfolio a point of view.',
    popular: 'The collaboration draws public interest beyond the designer’s usual circle. Your shared idea has found people willing to look twice.',
    flop: 'The collection attracts little public interest. The launch photographs contain several people concentrating very hard on being supportive.',
    mixed: 'The designer collaboration earns a mixed response. You leave with a finished collection credit and a clearer sense of which risks suit your work.',
  },
  ambassador: {
    cult: 'Industry reviewers praise the ambassador campaign. The public response is quieter; being the face of a brand does not guarantee people will look up.',
    crowd: 'The ambassador campaign catches on despite cool professional reviews. Your face becomes considerably more popular than the campaign’s explanation.',
    acclaimed: 'The ambassador campaign earns strong industry reviews. Your performance gives the brand a recognisable voice instead of another carefully lit promise.',
    popular: 'The ambassador campaign finds its audience. You are becoming recognisable as the brand’s face, which makes buying a rival product more interesting.',
    flop: 'The brand wanted a household name. You have become someone the household would still need introduced.',
    mixed: 'The ambassador campaign lands unevenly. You deliver your side of the production, even if nobody can agree on the brand’s side of the story.',
  },
  luxury: {
    cult: 'Industry reviewers admire the luxury campaign. Its public audience is as selective as the brand claims its customers are.',
    crowd: 'The luxury campaign attracts a crowd despite sceptical fashion reviews. The brand is delighted by attention it can continue describing as exclusive.',
    acclaimed: 'The luxury campaign earns strong professional praise. You make several extremely expensive objects look as though they belong in the same room.',
    popular: 'The luxury campaign draws an enthusiastic audience. Your work makes exclusivity unexpectedly easy to share.',
    flop: 'The luxury campaign attracts little public interest. For once, the brand has achieved complete exclusivity without trying.',
    mixed: 'The luxury campaign gets a mixed response. You keep the images in your portfolio; whether they count as art now depends on who is asking.',
  },
};

export const actorReleaseSummary = (category: string, critical: number, audience: number) => actor[category][reception(critical, audience, 76)];
export const modelReleaseSummary = (category: string, critical: number, audience: number) => model[category][reception(critical, audience, 80)];
