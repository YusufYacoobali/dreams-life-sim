import type { PetSpecies } from './pets';
import type { HobbyKind } from './leisure';
import type { AmenityId } from '../systems/lifestyleSchemas';
export type LifestyleOperation = { kind: 'condition' | 'maintenance' | 'bond' | 'training' | 'relationship' | 'mood' | 'pet-health' | 'competition' | 'asset-loss' | 'report-damage' | 'injury' | 'pet-comfort' | 'hobby-challenge'; amount: number };
type Choice = { id: string; label: string; costBps: number; body: string; operations: LifestyleOperation[] };
export type LifestyleTemplate = { id: string; domain: 'property' | 'vehicle' | 'pet' | 'hobby'; title: string; body: string; when?: 'tenant' | 'home' | 'damaged' | 'insured' | 'used' | 'trained' | 'unwell' | 'family' | 'vintage' | 'project' | 'skilled' | 'peer'; species?: PetSpecies; trait?: string; hobby?: HobbyKind; amenity?: AmenityId; choices: readonly [Choice, Choice] };
/** Original situations; terms and outcomes freeze when offered. */
export const lifestyleTemplates: readonly LifestyleTemplate[] = [
  {
    "id": "home-ceiling-map",
    "domain": "property",
    "when": "tenant",
    "title": "A new continent upstairs",
    "body": "{person} sends a photograph of a damp patch at {subject}. It resembles a small country with expansion plans.",
    "choices": [
      {
        "id": "repair",
        "label": "Send a plumber",
        "body": "The plumber finds the leak. You pay for the repair, and {person} can stop moving the bucket between chairs.",
        "operations": [
          {
            "kind": "condition",
            "amount": 5
          },
          {
            "kind": "relationship",
            "amount": 4
          }
        ],
        "costBps": 12
      },
      {
        "id": "estimate",
        "label": "Arrange an inspection first",
        "body": "You arrange an inspection and keep the repair estimate. The patch continues its quiet campaign for the landing.",
        "operations": [
          {
            "kind": "maintenance",
            "amount": 5
          },
          {
            "kind": "relationship",
            "amount": -2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-bass",
    "domain": "property",
    "when": "tenant",
    "title": "The wall has a beat",
    "body": "{person} says a neighbour’s bass reaches {subject} through the cutlery. Their spoon drawer now has a rhythm section.",
    "choices": [
      {
        "id": "mediate",
        "label": "Listen and mediate",
        "body": "You listen to {person} and discuss a sensible way to approach the neighbour. They are relieved you took it seriously.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 5
          },
          {
            "kind": "mood",
            "amount": -1
          }
        ],
        "costBps": 0
      },
      {
        "id": "dismiss",
        "label": "Call it free entertainment",
        "body": "{person} stops laughing before you finish. The spoons remain musical; your relationship is less harmonious.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -8
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-rent-cake",
    "domain": "property",
    "when": "tenant",
    "title": "An unusually good tenant",
    "body": "{person} has cleaned the shared entry and brought a cake. You inspect it for a rent-reduction message. It is simply cake.",
    "choices": [
      {
        "id": "thank",
        "label": "Thank them without a catch",
        "body": "You thank {person} and share the cake. For once, being a landlord involves a decent conversation.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 6
          }
        ],
        "costBps": 0
      },
      {
        "id": "suspicious",
        "label": "Ask what they want",
        "body": "They wanted to share a cake. You have made that more complicated than necessary.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -4
          },
          {
            "kind": "mood",
            "amount": -1
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-inspection-shoes",
    "domain": "property",
    "when": "tenant",
    "title": "Evidence of living",
    "body": "During an agreed inspection of {subject}, you find {person}’s shoes by the door. The property is, alarmingly, being used as a home.",
    "choices": [
      {
        "id": "respect",
        "label": "Respect their space",
        "body": "You keep the agreed visit brief. {person} relaxes when it becomes clear you understand what a home is for.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "lecture",
        "label": "Deliver a lecture about shoes",
        "body": "Your lecture achieves a silence normally reserved for power cuts. {person} will remember it.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -7
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-window-herb",
    "domain": "property",
    "when": "tenant",
    "title": "The window farm",
    "body": "{person} wants permission to keep herbs on the sill at {subject}. They have prepared a much longer explanation than basil deserves.",
    "choices": [
      {
        "id": "allow",
        "label": "Allow removable pots",
        "body": "You agree to removable pots. {person} looks absurdly relieved about the basil.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 5
          }
        ],
        "costBps": 0
      },
      {
        "id": "refuse",
        "label": "Refuse the basil",
        "body": "The tenancy continues, but you have become the reason somebody dislikes a building.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -5
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-investment-argument",
    "domain": "property",
    "when": "family",
    "title": "A roof with an opinion",
    "body": "{person} asks why {subject} gets new fittings before the household gets a quiet weekend.",
    "choices": [
      {
        "id": "listen",
        "label": "Talk about the shared priorities",
        "body": "You hear {person} out. The fittings can wait while you work out what matters to both of you.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 5
          },
          {
            "kind": "mood",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "numbers",
        "label": "Explain that the spreadsheet loves you",
        "body": "Your spreadsheet remains impressed. {person} would prefer to have been heard.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -5
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-first-dinner",
    "domain": "property",
    "when": "home",
    "title": "The table has arrived",
    "body": "You eat at {subject} without balancing a plate on a box. The room is still mostly empty. It already feels different.",
    "choices": [
      {
        "id": "stay",
        "label": "Take your time over dinner",
        "body": "You take your time. The room is still mostly empty, but it has stopped feeling temporary.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "measure",
        "label": "Spend dinner measuring for improvements",
        "body": "By dessert you have measured the same wall three times. The improvements remain plans for another day.",
        "operations": [
          {
            "kind": "mood",
            "amount": 1
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-garden-invasion",
    "domain": "property",
    "amenity": "garden",
    "title": "A very confident weed",
    "body": "One weed in {subject}’s garden has grown taller than the chair beside it. You briefly consider charging it rent.",
    "choices": [
      {
        "id": "tend",
        "label": "Tend the garden",
        "body": "You tend the actual garden and improve the grounds. The weed has a surprisingly substantial root system.",
        "operations": [
          {
            "kind": "condition",
            "amount": 2
          },
          {
            "kind": "mood",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "embrace",
        "label": "Declare a wild corner",
        "body": "You leave a small wild corner. Watching it move in the breeze turns out to be a good use of the chair.",
        "operations": [
          {
            "kind": "mood",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-pool-silence",
    "domain": "property",
    "amenity": "pool",
    "title": "Your expensive square of blue",
    "body": "For once, the pool at {subject} is quiet. No inflatable has wedged itself into a bush. Nobody is shouting about a missing sandal.",
    "choices": [
      {
        "id": "swim",
        "label": "Enjoy the quiet water",
        "body": "You enjoy the quiet water. Even the missing sandals have agreed to take the afternoon off.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "clean",
        "label": "Book proper pool maintenance",
        "body": "You pay for proper maintenance. The pool looks better, and you can stop pretending the filter will sort itself out.",
        "operations": [
          {
            "kind": "condition",
            "amount": 4
          }
        ],
        "costBps": 10
      }
    ]
  },
  {
    "id": "home-lock-trouble",
    "domain": "property",
    "title": "A door with boundaries",
    "body": "The front door at {subject} has decided only one particular wrist movement deserves entry.",
    "choices": [
      {
        "id": "fix",
        "label": "Pay a locksmith",
        "body": "You pay the locksmith. The door begins accepting ordinary human wrists again.",
        "operations": [
          {
            "kind": "condition",
            "amount": 4
          }
        ],
        "costBps": 6
      },
      {
        "id": "later",
        "label": "Keep practising the wrist movement",
        "body": "You keep using the wrist movement. The repair remains outstanding, and the door grows less cooperative.",
        "operations": [
          {
            "kind": "maintenance",
            "amount": 3
          },
          {
            "kind": "condition",
            "amount": -2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "home-covered-damage",
    "domain": "property",
    "when": "insured",
    "title": "The storm’s signature",
    "body": "A storm has lifted a section of gutter at {subject}. Your insurance policy is about to become less theoretical.",
    "choices": [
      {
        "id": "claim",
        "label": "Record the loss and claim",
        "body": "You record the damage and make a claim. Your cover pays 80% of the actual value lost; the remainder stays yours.",
        "operations": [
          {
            "kind": "asset-loss",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "repair",
        "label": "Pay for a direct repair",
        "body": "You pay for a direct repair. The gutter resumes its modest career of keeping water away from the walls.",
        "operations": [
          {
            "kind": "condition",
            "amount": 3
          }
        ],
        "costBps": 8
      }
    ]
  },
  {
    "id": "home-damage-report",
    "domain": "property",
    "when": "tenant",
    "title": "A name on the broken gate",
    "body": "Your tenant, {person}, admits breaking the gate at {subject} during an argument. They insist a gate should be able to take criticism.",
    "choices": [
      {
        "id": "report",
        "label": "Record the damage and report it",
        "body": "You report the named tenant’s admission and the actual damage. A vandalism incident is recorded for investigation; a report is not a conviction.",
        "operations": [
          {
            "kind": "report-damage",
            "amount": 1
          }
        ],
        "costBps": 0
      },
      {
        "id": "repair",
        "label": "Pay for the gate and keep it civil",
        "body": "You pay for the gate and discuss the damage with {person}. It is a better conversation than the one they had with the gate.",
        "operations": [
          {
            "kind": "condition",
            "amount": 3
          },
          {
            "kind": "relationship",
            "amount": 2
          }
        ],
        "costBps": 8
      }
    ]
  },
  {
    "id": "vehicle-warning-light",
    "domain": "vehicle",
    "when": "used",
    "title": "A tiny orange ultimatum",
    "body": "{subject} lights up a symbol that looks expensive in every language.",
    "choices": [
      {
        "id": "inspect",
        "label": "Pay for a diagnostic repair",
        "body": "You pay for the diagnostic work. The vehicle’s condition improves, and the orange symbol finally stops supervising you.",
        "operations": [
          {
            "kind": "condition",
            "amount": 7
          }
        ],
        "costBps": 8
      },
      {
        "id": "hope",
        "label": "Hope it is seasonal",
        "body": "The light is still there next time you look. The vehicle’s condition worsens while hope remains unusually affordable.",
        "operations": [
          {
            "kind": "condition",
            "amount": -4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-roadtrip-sandwich",
    "domain": "vehicle",
    "when": "used",
    "title": "The warm sandwich",
    "body": "After a recorded trip in {subject}, you find the sandwich you packed before leaving. It has developed its own weather.",
    "choices": [
      {
        "id": "clean",
        "label": "Pay for a proper interior clean",
        "body": "You pay for an interior clean. The cleaner does not ask you to identify the former filling.",
        "operations": [
          {
            "kind": "condition",
            "amount": 3
          }
        ],
        "costBps": 3
      },
      {
        "id": "bin",
        "label": "Dispose of it with dignity",
        "body": "You dispose of the sandwich. The memory remains longer than the smell.",
        "operations": [
          {
            "kind": "mood",
            "amount": 2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-parking-dispute",
    "domain": "vehicle",
    "when": "family",
    "title": "The disputed rectangle",
    "body": "{person} says {subject} occupies two parking spaces. You say it occupies one space and a small emotional buffer.",
    "choices": [
      {
        "id": "move",
        "label": "Park considerately",
        "body": "You move within the parking area. {person} appreciates the gesture more than your explanation.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "argue",
        "label": "Defend the emotional buffer",
        "body": "The argument outlasts any reasonable use of the space. {person} leaves less impressed with your judgement.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -5
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-mechanic-opera",
    "domain": "vehicle",
    "title": "The mechanic’s long inhale",
    "body": "The mechanic looks at {subject}, inhales through their teeth and begins speaking in tragic paragraphs.",
    "choices": [
      {
        "id": "second",
        "label": "Pay for an independent inspection",
        "body": "You pay for a second inspection and practical work. The new mechanic uses fewer tragic pauses.",
        "operations": [
          {
            "kind": "condition",
            "amount": 3
          }
        ],
        "costBps": 4
      },
      {
        "id": "leave",
        "label": "Leave and review a normal service",
        "body": "You take the quote away before contemplation becomes a bill. A normal service can be reviewed another day.",
        "operations": [
          {
            "kind": "mood",
            "amount": 1
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-family-borrow",
    "domain": "vehicle",
    "when": "family",
    "title": "Just a small favour",
    "body": "{person} asks to borrow {subject}. Their definition of “just around the corner” has previously been elastic.",
    "choices": [
      {
        "id": "decline",
        "label": "Decline politely",
        "body": "You decline politely. {person} is disappointed, but the keys stay where you left them.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -1
          }
        ],
        "costBps": 0
      },
      {
        "id": "offer",
        "label": "Suggest a drive together instead",
        "body": "You suggest reviewing a drive together instead. {person} likes the idea; the invitation and actual trip are still to arrange.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-covered-scrape",
    "domain": "vehicle",
    "when": "insured",
    "title": "The pillar won",
    "body": "A scrape on {subject} makes a concrete pillar’s position in the argument very clear.",
    "choices": [
      {
        "id": "claim",
        "label": "Record the loss under your cover",
        "body": "You record the loss under your cover. Insurance reimburses 80% of the lost value, and the scrape remains part of the vehicle’s history.",
        "operations": [
          {
            "kind": "asset-loss",
            "amount": 1
          }
        ],
        "costBps": 0
      },
      {
        "id": "repair",
        "label": "Pay for a cosmetic repair",
        "body": "You pay for a cosmetic repair. The pillar declines to contribute.",
        "operations": [
          {
            "kind": "condition",
            "amount": 4
          }
        ],
        "costBps": 5
      }
    ]
  },
  {
    "id": "vehicle-damaged-trip",
    "domain": "vehicle",
    "when": "damaged",
    "title": "An ambitious departure",
    "body": "{subject} is in poor condition. The journey plan is optimistic; the sound from the engine is not.",
    "choices": [
      {
        "id": "repair",
        "label": "Pay for a repair first",
        "body": "You pay for repairs before setting off. The vehicle becomes less alarming; the outing can be planned afterwards.",
        "operations": [
          {
            "kind": "condition",
            "amount": 10
          }
        ],
        "costBps": 15
      },
      {
        "id": "cancel",
        "label": "Cancel the outing",
        "body": "You postpone the outing. Staying home is disappointing, but it is considerably quieter than the engine.",
        "operations": [
          {
            "kind": "mood",
            "amount": -1
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-vintage-admirer",
    "domain": "vehicle",
    "when": "vintage",
    "title": "A stranger understands the noises",
    "body": "An enthusiast admires {subject} and correctly identifies three noises you thought were unique to yours.",
    "choices": [
      {
        "id": "talk",
        "label": "Enjoy the conversation",
        "body": "You enjoy a conversation with someone who understands the noises. Admiration turns out to be pleasant even without an offer.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "restore",
        "label": "Pay for careful restoration work",
        "body": "You pay for careful restoration. The condition improves, and one of the familiar noises finally retires.",
        "operations": [
          {
            "kind": "condition",
            "amount": 8
          }
        ],
        "costBps": 12
      }
    ]
  },
  {
    "id": "vehicle-repair-invoice",
    "domain": "vehicle",
    "title": "Labour is a state of mind",
    "body": "The repair quote for {subject} includes “investigative contemplation”. You suspect this means staring at it.",
    "choices": [
      {
        "id": "itemise",
        "label": "Approve only practical work",
        "body": "You approve and pay for practical, itemised work. The vehicle improves without any charge for a meaningful stare.",
        "operations": [
          {
            "kind": "condition",
            "amount": 5
          }
        ],
        "costBps": 7
      },
      {
        "id": "decline",
        "label": "Take the quote home",
        "body": "You take the quote home. The vehicle remains as it was, but your wallet has escaped the consultation.",
        "operations": [
          {
            "kind": "mood",
            "amount": 1
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-small-injury",
    "domain": "vehicle",
    "when": "used",
    "title": "The luggage wins a round",
    "body": "While unloading {subject}, a loose bag catches your ankle. This was not the dramatic travel story you had imagined.",
    "choices": [
      {
        "id": "rest",
        "label": "Stop and care for the ankle",
        "body": "You stop and give the ankle a rest. It settles before the afternoon develops a second plot.",
        "operations": [
          {
            "kind": "mood",
            "amount": -1
          }
        ],
        "costBps": 0
      },
      {
        "id": "push",
        "label": "Push through it",
        "body": "You keep lifting and suffer a sprain. The injury is now part of your medical history.",
        "operations": [
          {
            "kind": "injury",
            "amount": 25
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-wrong-song",
    "domain": "vehicle",
    "when": "used",
    "title": "The soundtrack has betrayed you",
    "body": "Your triumphant arrival in {subject} is accompanied by a children’s counting song you do not remember selecting.",
    "choices": [
      {
        "id": "sing",
        "label": "Commit to the chorus",
        "body": "You commit to the chorus. By seven you have lost your dignity and improved your afternoon.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "off",
        "label": "Turn it off very carefully",
        "body": "You restore silence. The number seven remains in your head for the rest of the day.",
        "operations": [
          {
            "kind": "mood",
            "amount": 1
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "vehicle-weather-window",
    "domain": "vehicle",
    "title": "The forecast has an opinion",
    "body": "You consider taking {subject} out. The forecast suggests that staying home has excellent visibility.",
    "choices": [
      {
        "id": "delay",
        "label": "Wait for better conditions",
        "body": "You leave the vehicle where it is. The first heavy drops make the decision look extremely wise.",
        "operations": [
          {
            "kind": "mood",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "plan",
        "label": "Use the time to plan carefully",
        "body": "You plan a future outing from somewhere dry. For once, preparation involves a comfortable chair.",
        "operations": [
          {
            "kind": "mood",
            "amount": 1
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-witness",
    "domain": "pet",
    "species": "parrot",
    "title": "The witness",
    "body": "{subject} has learned the phrase “absolutely not”. Guests now believe every invitation is being personally rejected.",
    "choices": [
      {
        "id": "redirect",
        "label": "Teach a more welcoming cue",
        "body": "You patiently practise a more welcoming cue with {subject}. “Absolutely not” begins to lose its monopoly.",
        "operations": [
          {
            "kind": "training",
            "amount": 3
          },
          {
            "kind": "bond",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "laugh",
        "label": "Laugh every single time",
        "body": "{subject} enjoys the reaction. Your bond grows more than their manners.",
        "operations": [
          {
            "kind": "bond",
            "amount": 4
          },
          {
            "kind": "pet-comfort",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-certificate",
    "domain": "pet",
    "species": "dog",
    "when": "trained",
    "title": "The professional dog",
    "body": "{subject} has made real training progress. You print a little certificate. They immediately try to eat it.",
    "choices": [
      {
        "id": "redirect",
        "label": "Practise the leave-it cue",
        "body": "You redirect {subject} and build on their training. The certificate survives in a less accessible position.",
        "operations": [
          {
            "kind": "training",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "photo",
        "label": "Remember the occasion",
        "body": "You remember an excellent student with a very specific taste in stationery.",
        "operations": [
          {
            "kind": "bond",
            "amount": 5
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-election",
    "domain": "pet",
    "species": "cat",
    "when": "family",
    "title": "The household election",
    "body": "{subject} chooses {person}’s lap, again. The rest of the household appears to have lost an election nobody announced.",
    "choices": [
      {
        "id": "accept",
        "label": "Respect the chosen lap",
        "body": "You give {subject} and {person} their quiet space. Losing this election has produced a rather peaceful room.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 4
          },
          {
            "kind": "relationship",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "compete",
        "label": "Compete for the cat’s attention",
        "body": "{subject} declines to adjudicate. Your campaign for attention costs you a little trust.",
        "operations": [
          {
            "kind": "bond",
            "amount": -2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-night-builder",
    "domain": "pet",
    "species": "hamster",
    "title": "Renovations at three",
    "body": "{subject} has rearranged the habitat while you slept. The wheel is apparently load-bearing.",
    "choices": [
      {
        "id": "enrich",
        "label": "Pay for safe enrichment",
        "body": "You pay for safe enrichment. {subject} investigates the additions as if they have been expecting the delivery.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 6
          }
        ],
        "costBps": 2
      },
      {
        "id": "watch",
        "label": "Watch the tiny architect work",
        "body": "You watch the tiny architect work. The habitat has a strong design direction and absolutely no committee.",
        "operations": [
          {
            "kind": "bond",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-vegetable-alarm",
    "domain": "pet",
    "species": "guinea-pig",
    "title": "The fridge has been opened",
    "body": "{subject} hears the fridge and announces a nutritional emergency. You were looking for mustard.",
    "choices": [
      {
        "id": "company",
        "label": "Keep them company at normal feeding time",
        "body": "You keep {subject} company at their normal mealtime. The mustard turns out not to be relevant to this emergency.",
        "operations": [
          {
            "kind": "bond",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "quiet",
        "label": "Wait until the chorus settles",
        "body": "You wait for the chorus to settle. Eventually the fridge can be opened without an announcement.",
        "operations": [
          {
            "kind": "mood",
            "amount": 2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-turtle-arrival",
    "domain": "pet",
    "species": "turtle",
    "title": "A deliberate friendship",
    "body": "{subject} comes towards you at a pace that suggests an appointment made several days ago.",
    "choices": [
      {
        "id": "wait",
        "label": "Give them all the time they need",
        "body": "You wait. The slow approach becomes a small, real moment of trust.",
        "operations": [
          {
            "kind": "bond",
            "amount": 5
          }
        ],
        "costBps": 0
      },
      {
        "id": "habitat",
        "label": "Check the habitat instead",
        "body": "You care for the familiar habitat. {subject} watches with the air of someone who has appointed a competent assistant.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-fish-audience",
    "domain": "pet",
    "species": "fish",
    "title": "A glass-fronted audience",
    "body": "{subject} follows you along the tank. Either you have bonded or you look exactly like a food dispenser.",
    "choices": [
      {
        "id": "watch",
        "label": "Spend quiet time by the tank",
        "body": "You spend quiet time beside the tank. Whatever {subject} thinks you are, they seem pleased to see you.",
        "operations": [
          {
            "kind": "bond",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "clean",
        "label": "Pay for habitat supplies",
        "body": "You pay for suitable habitat supplies. {subject} investigates the cleaner, more comfortable surroundings.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 6
          }
        ],
        "costBps": 2
      }
    ]
  },
  {
    "id": "pet-horse-gate",
    "domain": "pet",
    "species": "horse",
    "title": "A fence of suggestions",
    "body": "{subject} studies the gate with the patient confidence of someone who has seen you operate it.",
    "choices": [
      {
        "id": "latch",
        "label": "Pay for a safer latch",
        "body": "You pay for a safer latch. {subject} studies the revised arrangement with undiminished interest.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 6
          }
        ],
        "costBps": 6
      },
      {
        "id": "train",
        "label": "Practise a calm gate routine",
        "body": "You practise a calm, supervised gate routine on your grounds. {subject} begins to wait for your cue.",
        "operations": [
          {
            "kind": "training",
            "amount": 3
          },
          {
            "kind": "bond",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-rabbit-floor",
    "domain": "pet",
    "species": "rabbit",
    "title": "The floor has been inspected",
    "body": "{subject} investigates your socks, decides they are suspicious and returns for a second opinion.",
    "choices": [
      {
        "id": "sit",
        "label": "Sit quietly on the floor",
        "body": "You wait at {subject}’s level. Eventually your socks receive a less suspicious inspection.",
        "operations": [
          {
            "kind": "bond",
            "amount": 5
          }
        ],
        "costBps": 0
      },
      {
        "id": "space",
        "label": "Give them a quiet corner",
        "body": "You give {subject} a quiet corner. They settle without needing to explain themselves.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-stubborn-school",
    "domain": "pet",
    "trait": "stubborn",
    "title": "A counterproposal",
    "body": "You ask {subject} to move. They look at the destination, then lie down exactly where they are.",
    "choices": [
      {
        "id": "patient",
        "label": "Break the task into smaller steps",
        "body": "You break the task into smaller steps. {subject} accepts a modest revision to their counterproposal.",
        "operations": [
          {
            "kind": "training",
            "amount": 3
          },
          {
            "kind": "bond",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "stop",
        "label": "Stop while you still like each other",
        "body": "You end the session while you still like each other. {subject} appears happy with the agreement.",
        "operations": [
          {
            "kind": "bond",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-nervous-door",
    "domain": "pet",
    "trait": "nervous",
    "title": "The doorbell is a dragon",
    "body": "{subject} hears the bell and retreats. The visitor is less frightening than the sound announcing them.",
    "choices": [
      {
        "id": "quiet",
        "label": "Offer a quiet retreat",
        "body": "You offer a quiet retreat. {subject} settles when nobody insists on an introduction.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 5
          },
          {
            "kind": "bond",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "slow",
        "label": "Practise gently at a distance",
        "body": "You practise gently at a distance and stop before it becomes too much. A small improvement is enough for today.",
        "operations": [
          {
            "kind": "training",
            "amount": 2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-affectionate-shadow",
    "domain": "pet",
    "trait": "affectionate",
    "title": "An extra room companion",
    "body": "Every time you change rooms, {subject} appears as though they also urgently needed to be there.",
    "choices": [
      {
        "id": "stay",
        "label": "Stay in one room together",
        "body": "You stay in one room together. {subject} can finally stop managing your itinerary.",
        "operations": [
          {
            "kind": "bond",
            "amount": 5
          },
          {
            "kind": "mood",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "routine",
        "label": "Keep a reassuring routine",
        "body": "You keep the day reassuringly familiar. {subject} settles into the parts they recognise.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 5
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-mischief-sock",
    "domain": "pet",
    "trait": "mischievous",
    "title": "The missing exhibit",
    "body": "{subject} is unusually pleased with themselves. A small household object is conspicuously elsewhere.",
    "choices": [
      {
        "id": "redirect",
        "label": "Redirect the curiosity safely",
        "body": "You redirect the curiosity safely. {subject} finds a less disruptive use for all that interest.",
        "operations": [
          {
            "kind": "training",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "laugh",
        "label": "Enjoy the harmless nonsense",
        "body": "You laugh and retrieve your things. {subject} seems delighted that the expedition has been appreciated.",
        "operations": [
          {
            "kind": "bond",
            "amount": 4
          },
          {
            "kind": "mood",
            "amount": 2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-loyal-wait",
    "domain": "pet",
    "trait": "loyal",
    "title": "The familiar place",
    "body": "{subject} settles in their usual spot near you. You have not done anything interesting. That seems to be the point.",
    "choices": [
      {
        "id": "company",
        "label": "Keep them company",
        "body": "You make room for familiar company. Neither of you needs the afternoon to become more interesting.",
        "operations": [
          {
            "kind": "bond",
            "amount": 5
          },
          {
            "kind": "mood",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "touch",
        "label": "Offer a gentle, familiar cue",
        "body": "You practise a gentle familiar cue. {subject} settles, then stays a little closer.",
        "operations": [
          {
            "kind": "training",
            "amount": 2
          },
          {
            "kind": "bond",
            "amount": 2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-curious-box",
    "domain": "pet",
    "trait": "curious",
    "title": "The unopened universe",
    "body": "{subject} regards a safe empty container with the concentration usually reserved for a major scientific grant.",
    "choices": [
      {
        "id": "supervise",
        "label": "Supervise an exploration",
        "body": "You supervise the exploration. {subject} makes a thorough examination of the small new universe.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 4
          },
          {
            "kind": "bond",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "rotate",
        "label": "Pay for suitable enrichment",
        "body": "You pay for suitable enrichment. {subject} begins a fresh investigation.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 6
          }
        ],
        "costBps": 2
      }
    ]
  },
  {
    "id": "pet-energetic-circuit",
    "domain": "pet",
    "trait": "energetic",
    "title": "Still available for activities",
    "body": "{subject} has finished the previous activity and is now offering several urgent proposals for the next one.",
    "choices": [
      {
        "id": "settle",
        "label": "Practise settling down",
        "body": "You practise a short settling cue. For a few beautiful moments, the urgent proposals stop.",
        "operations": [
          {
            "kind": "training",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "quiet",
        "label": "Make a quiet end to the session",
        "body": "You make a calm end to the session. {subject} finally finds a comfortable place for all those limbs.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 4
          },
          {
            "kind": "bond",
            "amount": 2
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "pet-health-patience",
    "domain": "pet",
    "when": "unwell",
    "title": "The slow afternoon",
    "body": "{subject} is dealing with a recorded health concern. Today they want the familiar room and your company.",
    "choices": [
      {
        "id": "stay",
        "label": "Stay nearby",
        "body": "You stay nearby. {subject} is still unwell, but the afternoon becomes a little easier to bear.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 5
          },
          {
            "kind": "bond",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "supplies",
        "label": "Pay for suitable comfort supplies",
        "body": "You pay for suitable comfort supplies. The health concern still needs its own care, but {subject} rests more comfortably.",
        "operations": [
          {
            "kind": "pet-comfort",
            "amount": 8
          }
        ],
        "costBps": 3
      }
    ]
  },
  {
    "id": "pet-family-memory",
    "domain": "pet",
    "when": "family",
    "title": "Their person, too",
    "body": "{person} tells you about a small habit {subject} has when you are not in the room. You realise this is their friendship as well.",
    "choices": [
      {
        "id": "listen",
        "label": "Make time for their quiet moment",
        "body": "You give {person} and {subject} their own quiet moment. It is lovely to see a friendship that belongs to them.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 4
          },
          {
            "kind": "pet-comfort",
            "amount": 4
          }
        ],
        "costBps": 0
      },
      {
        "id": "include",
        "label": "Join them gently",
        "body": "You join gently. For a while, the whole room seems to have found the same pace.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 2
          },
          {
            "kind": "bond",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-chess-prodigy",
    "domain": "hobby",
    "hobby": "chess",
    "when": "peer",
    "title": "The look across the chessboard",
    "body": "{person}, whom you actually met through practice, sits across from you with the confidence of someone expecting to mark your work.",
    "choices": [
      {
        "id": "study",
        "label": "Play a careful positional game",
        "body": "You take the informal game seriously.",
        "operations": [
          {
            "kind": "hobby-challenge",
            "amount": 12
          }
        ],
        "costBps": 0
      },
      {
        "id": "laugh",
        "label": "Try a reckless opening",
        "body": "You try an ambitious opening in the informal game.",
        "operations": [
          {
            "kind": "hobby-challenge",
            "amount": -8
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-guitar-two-chords",
    "domain": "hobby",
    "hobby": "guitar",
    "title": "Two chords and a grievance",
    "body": "Your guitar practice has produced a furious little tune about a bus. It is the most emotionally honest thing you have played.",
    "choices": [
      {
        "id": "finish",
        "label": "Work carefully on the ending",
        "body": "You work on the ending, then test the phrase in practice.",
        "operations": [
          {
            "kind": "hobby-challenge",
            "amount": 8
          }
        ],
        "costBps": 0
      },
      {
        "id": "enjoy",
        "label": "Play it just for yourself",
        "body": "You play the ridiculous little tune for yourself. The bus has never inspired such commitment.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-painting-bowl",
    "domain": "hobby",
    "hobby": "painting",
    "title": "The fruit has concerns",
    "body": "The fruit in your painting appears to be waiting for bad news. You had intended a cheerful still life.",
    "choices": [
      {
        "id": "study",
        "label": "Study the light again",
        "body": "You study the light and work patiently at the next brushstroke. The fruit begins to look less recently bereaved.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "keep",
        "label": "Enjoy the uneasy fruit",
        "body": "You enjoy the uneasy fruit. It is the most interesting mistake you have made all week.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-photo-bin",
    "domain": "hobby",
    "hobby": "photography",
    "title": "The decisive wheelie bin",
    "body": "Your most carefully composed practice photograph features a wheelie bin in a position of immense emotional significance.",
    "choices": [
      {
        "id": "study",
        "label": "Study why the composition works",
        "body": "You study why the composition works. The bin has been doing excellent visual work without any recognition.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "laugh",
        "label": "Accept your new subject",
        "body": "You enjoy finding something strange in an ordinary street. You start noticing the edges of things again.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-reading-character",
    "domain": "hobby",
    "hobby": "reading",
    "title": "An argument with a paragraph",
    "body": "You disagree with a fictional character so strongly that you have started pacing between chapters.",
    "choices": [
      {
        "id": "notes",
        "label": "Write down why it works",
        "body": "You make notes about why the character bothers you. The pacing gives way to a rather good discussion with yourself.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "walk",
        "label": "Let the argument be enjoyable",
        "body": "You enjoy the argument. It is a relief to care about someone who cannot send a message afterwards.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-gaming-save",
    "domain": "hobby",
    "hobby": "gaming",
    "title": "The heroic cupboard",
    "body": "Your practice game’s heroic final move has trapped the main character in a cupboard. The soundtrack remains extremely confident.",
    "choices": [
      {
        "id": "review",
        "label": "Review the move patiently",
        "body": "You work patiently through the move. The cupboard becomes a lesson instead of the ending.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "laugh",
        "label": "Enjoy the accidental ending",
        "body": "You enjoy the accidental finale. The heroic soundtrack has never worked harder.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-cooking-soup",
    "domain": "hobby",
    "hobby": "cooking",
    "title": "Soup with structural ambitions",
    "body": "Your supervised practice soup has become thick enough to remember the shape of the spoon.",
    "choices": [
      {
        "id": "adjust",
        "label": "Adjust it carefully",
        "body": "You adjust the soup carefully with the ingredients from the session. Eventually the spoon can leave without assistance.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "accept",
        "label": "Enjoy an unexpectedly hearty lesson",
        "body": "You accept an unusually hearty lesson. Next time you will recognise the moment before soup becomes architecture.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-gardening-one-leaf",
    "domain": "hobby",
    "hobby": "gardening",
    "title": "The leaf of enormous importance",
    "body": "One new leaf has appeared in your shared growing space. You inspect it with the intensity of a parent at a graduation.",
    "choices": [
      {
        "id": "care",
        "label": "Keep to the actual care routine",
        "body": "You keep to the shared growing space’s care routine. The new leaf survives the intensity of your interest.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "enjoy",
        "label": "Enjoy the small success",
        "body": "You enjoy the small success. The leaf does not need to be a metaphor for anything.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-running-hill",
    "domain": "hobby",
    "hobby": "running",
    "title": "A hill with excellent timing",
    "body": "You have just announced that running feels easier when the route introduces a hill.",
    "choices": [
      {
        "id": "pace",
        "label": "Slow down and keep a sensible pace",
        "body": "You slow down and keep a sensible pace. The hill remains steep, but it stops being a personal argument.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "walk",
        "label": "Walk the hill and enjoy the view",
        "body": "You walk the hill and enjoy the view. There is quite a lot to see when you are not glaring at the ground.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-swimming-lane",
    "domain": "hobby",
    "hobby": "swimming",
    "title": "The elegant lane rope",
    "body": "During supervised swimming practice, you arrive at the lane rope with far more affection than intended.",
    "choices": [
      {
        "id": "technique",
        "label": "Work on sighting carefully",
        "body": "You work carefully on sighting under supervision. The rope receives fewer surprise visits.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "rest",
        "label": "Take a sensible break",
        "body": "You take a sensible break at the side. It is easier to learn when you are ready to listen again.",
        "operations": [
          {
            "kind": "mood",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-writing-adverb",
    "domain": "hobby",
    "hobby": "writing",
    "title": "The sentence will not end",
    "body": "A sentence in your writing practice has acquired three subordinate clauses and a deeply unnecessary weather report.",
    "choices": [
      {
        "id": "cut",
        "label": "Cut it down to the thing you mean",
        "body": "You cut the sentence down and test the revised paragraph.",
        "operations": [
          {
            "kind": "hobby-challenge",
            "amount": 8
          }
        ],
        "costBps": 0
      },
      {
        "id": "keep",
        "label": "Save the ridiculous draft for yourself",
        "body": "You save the ridiculous draft for yourself. One day the weather report may be funny for the right reasons.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-pottery-handle",
    "domain": "hobby",
    "hobby": "pottery",
    "title": "A handle in search of a mug",
    "body": "The handle on your practice mug has ambitions far beyond the mug. It looks ready to pull a door.",
    "choices": [
      {
        "id": "remake",
        "label": "Work on the join under supervision",
        "body": "You revise the join under supervision and test the practice piece.",
        "operations": [
          {
            "kind": "hobby-challenge",
            "amount": 8
          }
        ],
        "costBps": 0
      },
      {
        "id": "laugh",
        "label": "Appreciate an exceptionally grippable mistake",
        "body": "You enjoy an exceptionally grippable mistake. It has been a good afternoon to make something with your hands.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-singing-note",
    "domain": "hobby",
    "hobby": "singing",
    "title": "A note from another postcode",
    "body": "You and the choir arrive at two different notes. Yours seems to have travelled further.",
    "choices": [
      {
        "id": "listen",
        "label": "Listen and find the shared pitch",
        "body": "You listen carefully and try the shared phrase again.",
        "operations": [
          {
            "kind": "hobby-challenge",
            "amount": 8
          }
        ],
        "costBps": 0
      },
      {
        "id": "smile",
        "label": "Smile and start the phrase again",
        "body": "You smile and start again. It feels good to belong to a group that leaves room for another attempt.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-coding-button",
    "domain": "hobby",
    "hobby": "coding",
    "title": "The button has one job",
    "body": "Your practice button now closes the very thing it was meant to open. At least it is decisive.",
    "choices": [
      {
        "id": "debug",
        "label": "Read the error and fix one thing",
        "body": "You read the error and fix one thing at a time. Eventually the button performs its single, modest responsibility.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "pause",
        "label": "Leave a note and take a break",
        "body": "You leave a useful note and take a break. Tomorrow’s version of you deserves a clue.",
        "operations": [
          {
            "kind": "mood",
            "amount": 3
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-fishing-reed",
    "domain": "hobby",
    "hobby": "fishing",
    "title": "An exceptionally athletic reed",
    "body": "Your supervised fishing session produces a convincing bite. You have caught the same reed twice.",
    "choices": [
      {
        "id": "learn",
        "label": "Ask for help with the cast",
        "body": "You ask for help with the supervised cast. The reed is spared a third encounter.",
        "operations": [
          {
            "kind": "competition",
            "amount": 2
          }
        ],
        "costBps": 0
      },
      {
        "id": "quiet",
        "label": "Enjoy sitting by the water",
        "body": "You enjoy sitting by the water. The fish are under no obligation to improve the afternoon.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-dancing-elbow",
    "domain": "hobby",
    "hobby": "dancing",
    "title": "A solo by your elbow",
    "body": "Your feet follow the routine. Your elbow appears to have accepted a different booking.",
    "choices": [
      {
        "id": "slow",
        "label": "Slow the movement down",
        "body": "You slow the movement down, then try the phrase in practice.",
        "operations": [
          {
            "kind": "hobby-challenge",
            "amount": 8
          }
        ],
        "costBps": 0
      },
      {
        "id": "enjoy",
        "label": "Enjoy being imperfect in company",
        "body": "You enjoy being imperfect in company. Your elbow is eventually persuaded to rejoin the routine.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-project-half",
    "domain": "hobby",
    "when": "project",
    "title": "The middle is mostly middle",
    "body": "Your project, “{project}”, has reached the part where the first excitement has worn off and the ending is still a rumour.",
    "choices": [
      {
        "id": "plan",
        "label": "Choose one manageable next step",
        "body": "You choose one manageable next step. The project feels possible again; the next actual work session is still ahead.",
        "operations": [
          {
            "kind": "competition",
            "amount": 3
          }
        ],
        "costBps": 0
      },
      {
        "id": "rest",
        "label": "Take an evening off without abandoning it",
        "body": "You take the evening off. The work you have already done will still be there when you come back.",
        "operations": [
          {
            "kind": "mood",
            "amount": 4
          }
        ],
        "costBps": 0
      }
    ]
  },
  {
    "id": "hobby-friendly-rival",
    "domain": "hobby",
    "when": "family",
    "title": "A very friendly comparison",
    "body": "{person} asks how your {subject} is going. Their own enthusiasm makes the question feel dangerously competitive.",
    "choices": [
      {
        "id": "share",
        "label": "Share the awkward bits, too",
        "body": "You share the awkward bits as well as the progress. {person} is easier to talk to when neither of you is keeping score.",
        "operations": [
          {
            "kind": "relationship",
            "amount": 5
          }
        ],
        "costBps": 0
      },
      {
        "id": "boast",
        "label": "Make your progress sound effortless",
        "body": "You make it sound effortless. {person} grows quieter, and the conversation becomes less friendly.",
        "operations": [
          {
            "kind": "relationship",
            "amount": -4
          }
        ],
        "costBps": 0
      }
    ]
  }
];
