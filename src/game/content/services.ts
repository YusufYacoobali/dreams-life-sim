export const serviceKinds=['astronaut','military'] as const;
export type ServiceKind=typeof serviceKinds[number];
export const serviceBranches=['space-program','army','navy','air-service'] as const;
export const assignmentKinds=['orbital-research','habitat-maintenance','disaster-relief','overseas-rotation'] as const;
/** Fictional programmes and authored game rules, not national recruitment policies. */
export const serviceCatalog={
 astronaut:{title:'Astronaut',art:'astronaut' as const,roleId:'space-program',skill:'science' as const,minAge:25,maxEntryAge:45,maxAge:65,training:24,trainingLimit:36,term:60,skillRequired:60,smarts:70,health:70,fitness:65,traineeBps:12000,qualifiedBps:18000,passScore:65,ranks:['Candidate','Flight Specialist','Senior Specialist','Mission Lead']},
 military:{title:'Military',art:'military' as const,roleId:'military-service',skill:'service' as const,minAge:18,maxEntryAge:40,maxAge:60,training:6,trainingLimit:12,term:48,skillRequired:30,smarts:35,health:65,fitness:60,traineeBps:8000,qualifiedBps:10000,passScore:50,ranks:['Recruit','Service Specialist','Senior Specialist','Section Lead']},
};
export const assignmentCatalog={
 'orbital-research':{title:'Orbital Research',kind:'astronaut' as ServiceKind,location:'Meridian Orbital Laboratory',target:90,injuryBps:30,fatalBps:1},
 'habitat-maintenance':{title:'Habitat Maintenance',kind:'astronaut' as ServiceKind,location:'Meridian Orbital Habitat',target:90,injuryBps:20,fatalBps:1},
 'disaster-relief':{title:'Disaster Relief',kind:'military' as ServiceKind,location:'Overseas Relief Station',target:60,injuryBps:20,fatalBps:1},
 'overseas-rotation':{title:'Overseas Rotation',kind:'military' as ServiceKind,location:'Overseas Service Station',target:60,injuryBps:40,fatalBps:4},
};
