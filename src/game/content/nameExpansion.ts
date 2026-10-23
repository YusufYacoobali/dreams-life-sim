import type { CountryCode } from '../countries';
import type { Person } from '../model';

const names = (text: string): readonly string[] => text.split('|');
const english = {
  male: names('Liam|Oliver|Noah|William|Henry|Theodore|James|Lucas|Benjamin|Elijah|Leo|Jack|Ethan|Samuel|Alexander|Thomas|Daniel|Isaac|Joseph|Gabriel|Owen|Mason|Levi|Sebastian|Nathan|Caleb|Julian|Matthew|David|Dylan|Joshua|Anthony|Miles|Hudson|Arthur|Oscar|Archie|Alfie|Finn|Jasper|Arlo|Rory|Connor|Ryan|Lachlan|Angus|Alistair|Rhys'),
  female: names('Olivia|Emma|Charlotte|Amelia|Sophia|Isabella|Ava|Mia|Evelyn|Luna|Harper|Eleanor|Elizabeth|Violet|Scarlett|Emily|Hazel|Lily|Aurora|Penelope|Aria|Nora|Chloe|Ellie|Mila|Layla|Abigail|Ella|Isla|Madison|Zoe|Ivy|Grace|Lucy|Willow|Naomi|Victoria|Stella|Leah|Hannah|Freya|Florence|Matilda|Ruby|Poppy|Maisie|Imogen|Maya'),
  nonbinary: names('Alex|Jordan|Morgan|Avery|Taylor|Sam|Casey|Quinn|Rowan|Riley|Sage|Reese|Robin|Charlie|Parker|Skyler|Dakota|River|Finley|Emerson|Jamie|Drew|Blair|Cameron'),
};

/** Authored local name pools; no network lookup or runtime name generation. */
export const firstNameExpansions: Record<CountryCode, Record<Person['gender'], readonly string[]>> = {
  US: english,
  CA: {
    male: [...english.male, ...names('Louis|Émile|Félix|Hugo|Raphaël|Antoine|Alexis|Charles|Xavier|Victor|Adam|Elliot|Nicolas|Julien|Mohammed|Zachary')],
    female: [...english.female, ...names('Alice|Rose|Léa|Juliette|Béatrice|Rosalie|Laurence|Élodie|Jeanne|Clara|Livia|Zoé|Adèle|Éloïse|Margot|Noémie|Fatima|Aisha|Simone|Gabrielle')],
    nonbinary: [...english.nonbinary, 'Camille'],
  },
  GB: {
    male: [...english.male, ...names('George|Muhammad|Harry|Freddie|Theo|Edward|Max|Teddy|Reuben|Harrison|Jude|Toby|Stanley|Hamish|Idris|Callum|Fraser|Ellis')],
    female: [...english.female, ...names('Elsie|Evie|Rosie|Daisy|Sienna|Alice|Phoebe|Millie|Eleanor|Harriet|Esme|Holly|Georgia|Jessica|Aaliyah|Fatima|Zara|Eilidh|Cerys|Nia|Megan|Bethan|Skye')],
    nonbinary: [...english.nonbinary, ...names('Frankie|Ashley|Ellis|Jesse')],
  },
  AU: {
    male: [...english.male, ...names('Harrison|Max|Hunter|Cooper|Patrick|Toby|Flynn|Beau|Hugo|Ashton|Zachary|Xavier')],
    female: [...english.female, ...names('Sophie|Sienna|Evie|Elsie|Georgia|Mackenzie|Audrey|Savannah|Phoebe|Clara|Rose|Daisy|Billie|Frankie|Alice')],
    nonbinary: [...english.nonbinary, ...names('Kai|Harper|Frankie|Billie|Darcy|Blake|Ashley|Jesse|Remy')],
  },
  FR: {
    male: names('Gabriel|Jules|Louis|Raphaël|Léo|Arthur|Adam|Maël|Lucas|Hugo|Noah|Liam|Gabin|Paul|Nathan|Sacha|Éden|Aaron|Mohamed|Isaac|Ethan|Nino|Antoine|Victor|Valentin|Clément|Maxime|Baptiste|Théo|Mathis|Alexandre|Thomas|Julien|Étienne|Lucien|Marceau|Gaspard|Augustin|Timothée|Malo|Ibrahim|Yanis|Romain|Simon|Axel|Noé|Basile|Félix'),
    female: names('Louise|Chloé|Camille|Léa|Jade|Ambre|Alba|Emma|Rose|Alice|Romy|Anna|Mia|Lina|Julia|Mila|Inès|Léna|Agathe|Iris|Juliette|Jeanne|Louna|Zoé|Margaux|Manon|Charlotte|Adèle|Élise|Clara|Lucie|Mathilde|Sarah|Nina|Capucine|Gabrielle|Margot|Pauline|Céleste|Victoire|Émilie|Anaïs|Salomé|Apolline|Maëlle|Noémie|Héloïse|Yasmine'),
    nonbinary: names('Camille|Sacha|Noa|Charlie|Alix|Lou|Claude|Dominique|Yaël|Ange|Morgan|Eden|Ariel|Loan|Sasha|Alex'),
  },
  DE: {
    male: names('Emil|Luca|Finn|Noah|Matteo|Leon|Paul|Theo|Elias|Louis|Henry|Liam|Ben|Felix|Anton|Oskar|Jonas|Maximilian|Jakob|Moritz|Niklas|Julian|Alexander|David|Samuel|Simon|Jonathan|Philipp|Carl|Milan|Leopold|Johann|Friedrich|Lukas|Tobias|Vincent|Hannes|Jannik|Benedikt|Konstantin|Fabian|Florian|Sebastian|Adrian|Yusuf|Amir|Levi|Erik'),
    female: names('Hannah|Mia|Leonie|Emma|Emilia|Sophia|Sofia|Ella|Lina|Clara|Leni|Marie|Mila|Lia|Ida|Mathilda|Frieda|Charlotte|Johanna|Luisa|Amelie|Anna|Lotta|Greta|Lea|Nora|Maja|Luna|Elisa|Paula|Lilly|Nele|Alina|Helena|Theresa|Marlene|Isabel|Victoria|Carla|Jule|Ronja|Annika|Katharina|Julia|Franziska|Selma|Aylin|Zeynep'),
    nonbinary: names('Kim|Toni|Mika|Alex|Robin|Sascha|Jona|Kai|Lou|Charlie|Sam|Noa|Luan|Eden|Ari|Quinn'),
  },
  ES: {
    male: names('Hugo|Mateo|Leo|Pablo|Martín|Lucas|Manuel|Alejandro|Daniel|Álvaro|Adrián|Enzo|Diego|Mario|David|Bruno|Marcos|Javier|Antonio|Miguel|Ángel|Jaime|Nicolás|Gabriel|Samuel|Gonzalo|Sergio|Izan|Eric|Guillermo|Rodrigo|Iván|Rafael|Héctor|Pedro|Fernando|Luis|Jorge|Rubén|Víctor|Andrés|Eduardo|Ramón|Óscar|Álex|Pol|Pau|Iker'),
    female: names('Lucía|Sofía|Valeria|Martina|María|Julia|Paula|Emma|Daniela|Carla|Alba|Noa|Alma|Carmen|Olivia|Lola|Jimena|Vega|Sara|Claudia|Mia|Laia|Aitana|Elena|Ana|Inés|Adriana|Abril|Blanca|Alejandra|Candela|Irene|Marta|Rocío|Nerea|Natalia|Silvia|Alicia|Isabel|Beatriz|Teresa|Eva|Clara|Celia|Nuria|Marina|Vera|Cristina'),
    nonbinary: names('Álex|Dani|Cris|Noa|Ariel|Eli|Cruz|Reyes|Sam|Sasha|Charlie|Robin|Alexis|Guadalupe|Rene|Eden'),
  },
  IT: {
    male: names('Leonardo|Lorenzo|Andrea|Matteo|Edoardo|Tommaso|Francesco|Alessandro|Mattia|Gabriele|Riccardo|Filippo|Nicolò|Antonio|Giovanni|Federico|Giuseppe|Davide|Luca|Pietro|Diego|Samuele|Christian|Giacomo|Enea|Simone|Marco|Domenico|Giorgio|Michele|Salvatore|Vincenzo|Alberto|Daniele|Elia|Luigi|Carlo|Roberto|Paolo|Stefano|Valerio|Cesare|Dario|Fabio|Raffaele|Emilio|Sergio|Bruno'),
    female: names('Giulia|Sofia|Alice|Emma|Aurora|Ginevra|Vittoria|Beatrice|Ludovica|Matilde|Camilla|Benedetta|Bianca|Gaia|Greta|Anna|Giorgia|Chiara|Sara|Viola|Francesca|Martina|Elena|Caterina|Noemi|Arianna|Rebecca|Miriam|Alessia|Nicole|Elisa|Valentina|Giada|Irene|Marta|Linda|Rosa|Clara|Lucia|Adele|Margherita|Isabella|Angela|Silvia|Serena|Laura|Paola|Teresa'),
    nonbinary: names('Alex|Dani|Sasha|Noa|Ariel|Sam|Robin|Charlie|Eli|Lou|Cris|Kim|Toni|Morgan|Niki|Eden'),
  },
  BR: {
    male: names('Miguel|Arthur|Gabriel|Lucas|Heitor|Theo|Davi|Bernardo|Samuel|João|Pedro|Guilherme|Lorenzo|Nicolas|Rafael|Matheus|Enzo|Henrique|Benício|Gustavo|Isaac|Antônio|Daniel|Leonardo|Vicente|Benjamin|Luiz|Caio|Joaquim|Eduardo|Felipe|Augusto|Vinícius|Murilo|Vitor|Francisco|José|Bruno|André|Carlos|Diego|Thiago|Fernando|Rodrigo|Marcelo|Renan|Leandro|Otávio'),
    female: names('Helena|Alice|Laura|Sofia|Maria|Cecília|Maitê|Valentina|Heloísa|Manuela|Liz|Antonella|Isabella|Luísa|Júlia|Lívia|Lorena|Eloá|Giovanna|Isadora|Sophia|Mariana|Ana|Beatriz|Clara|Yasmin|Melissa|Rafaela|Isabel|Elisa|Esther|Lara|Isis|Joana|Vitória|Letícia|Camila|Bruna|Bianca|Carolina|Gabriela|Amanda|Renata|Fernanda|Juliana|Patrícia|Priscila|Natália'),
    nonbinary: names('Alex|Ariel|Dani|Cris|Sasha|Sam|Charlie|Kim|Morgan|Robin|Noa|Rene|Val|Alê|Niki|Cami'),
  },
  IN: {
    male: names('Aarav|Arjun|Rohan|Kabir|Vihaan|Aditya|Ishaan|Reyansh|Krishna|Atharv|Ayaan|Shaurya|Vivaan|Dhruv|Advait|Arnav|Rudra|Vedant|Yash|Aadi|Dev|Neel|Aryan|Rahul|Amit|Ravi|Vikram|Siddharth|Karthik|Raghav|Varun|Nikhil|Pranav|Anirudh|Harsh|Manav|Rishabh|Tejas|Sanjay|Vivek|Akash|Suraj|Rizwan|Imran|Farhan|Armaan|Ibrahim|Zayan'),
    female: names('Anaya|Diya|Priya|Isha|Aadhya|Ananya|Saanvi|Avni|Myra|Ira|Kiara|Aarohi|Pari|Riya|Navya|Naira|Aditi|Kavya|Meera|Sita|Nandini|Pooja|Neha|Shreya|Sneha|Anjali|Deepika|Radhika|Tanvi|Vanya|Ishita|Aisha|Fatima|Zoya|Sana|Amira|Noor|Mariam|Lakshmi|Divya|Lavanya|Harini|Kalyani|Sahana|Madhavi|Revathi|Nisha|Shalini'),
    nonbinary: names('Kiran|Arya|Sai|Harpreet|Jaspreet|Navjot|Simran|Anmol|Gurpreet|Manpreet|Sukhpreet|Kamal|Samar|Sonu|Ashu|Noor'),
  },
  JP: {
    male: names('Haruto|Ren|Sora|Minato|Riku|Yuto|Yuma|Sota|Yuki|Haruki|Takumi|Kaito|Itsuki|Hayato|Daiki|Hiroto|Sosuke|Tsubasa|Shota|Ryota|Kota|Kenta|Sho|Shun|Daichi|Naoki|Daisuke|Takuya|Keita|Yuji|Kenji|Hiroshi|Takeshi|Satoshi|Masato|Toshiro|Koji|Akihiro|Ryosuke|Kazuki|Tomoya|Taichi|Yoshiki|Naoya|Masaki|Reo|Hinata|Asahi'),
    female: names('Yui|Hina|Akari|Sakura|Himari|Mei|Aoi|Rin|Tsumugi|Ichika|Yuzuki|Mio|Riko|Yuna|Hana|Sara|Honoka|Koharu|Nanami|Haruka|Miyu|Saki|Ayaka|Misaki|Yuka|Natsumi|Kaori|Sayaka|Emi|Akiko|Yoko|Keiko|Naoko|Sachiko|Yumiko|Kyoko|Reina|Momoka|Kana|Rina|Asuka|Shiori|Chihiro|Nozomi|Maki|Ayumi|Tomoko|Yumi'),
    nonbinary: names('Sora|Akira|Hinata|Aoi|Asahi|Asuka|Haru|Hikaru|Izumi|Kaede|Makoto|Nao|Natsuki|Rei|Rin|Yuki|Yu|Haruka|Chihiro|Itsuki'),
  },
  ZA: {
    male: names('Liam|Sipho|Thabo|Lethabo|Themba|Siyabonga|Sibusiso|Bongani|Mandla|Musa|Nkosi|Sandile|Sizwe|Vusi|Vuyo|Andile|Lungelo|Lwazi|Lwandle|Aphiwe|Dumisani|Kabelo|Tshepo|Kagiso|Thabang|Tumelo|Lebogang|Thato|Bokang|Johan|Pieter|Willem|Francois|Jacobus|Stefan|Heinrich|Daniel|Ethan|Noah|Joshua|Caleb|Adam|Yusuf|Muhammad|Arjun|Rohan|Devin|Keshav'),
    female: names('Amahle|Ava|Naledi|Thando|Nomsa|Zanele|Nokuthula|Nompumelelo|Lindiwe|Busisiwe|Ayanda|Buhle|Sihle|Khanya|Unathi|Nosipho|Nandi|Zinhle|Lihle|Anele|Nolwazi|Babalwa|Zoleka|Dineo|Palesa|Lerato|Boitumelo|Keabetswe|Kgomotso|Mpho|Lesedi|Refilwe|Karabo|Mia|Emma|Sophia|Isabella|Anika|Marli|Elize|Chantelle|Danielle|Ayesha|Fatima|Priya|Anjali|Kavya|Leah'),
    nonbinary: names('Lethabo|Thando|Lesedi|Lerato|Karabo|Refilwe|Tshegofatso|Kgothatso|Neo|Omphile|Onalenna|Mpho|Amogelang|Bokamoso|Kamogelo|Ofentse|Kutlwano|Simphiwe|Buhle|Unathi|Khanya|Anele|Sihle|Alex'),
  },
};

export const familyNamePools: Record<CountryCode, readonly string[]> = {
  US: names('Carter|Bennett|Brooks|Reed|Ellis|Smith|Johnson|Williams|Brown|Jones|Garcia|Miller|Davis|Rodriguez|Martinez|Hernandez|Lopez|Gonzalez|Wilson|Anderson|Thomas|Taylor|Moore|Jackson|Martin|Lee|Perez|Thompson|White|Harris|Sanchez|Clark|Ramirez|Lewis|Robinson|Walker|Young|Allen|King|Wright|Scott|Torres|Nguyen|Hill|Flores|Green|Adams|Nelson|Patel|Chen|Rivera|Campbell|Mitchell|Roberts|Turner|Phillips|Parker|Evans|Edwards|Collins'),
  CA: names('Martin|Wilson|Roy|Campbell|Chen|Smith|Brown|Tremblay|Lee|Gagnon|Wong|Taylor|Côté|Johnson|White|Bouchard|Gauthier|Miller|Ouellet|Morin|Lavoie|Fortin|Gagné|Anderson|Li|MacDonald|Thompson|Young|Scott|Singh|Leblanc|Nguyen|Bergeron|Lefebvre|Mercier|Davis|Fraser|McKenzie|Clarke|Stewart|Robertson|Murray|Reid|Ross|Pelletier|Simard|Bélanger|Fournier|Desjardins|Girard|Patel|Ahmed|Khan|Ali|Gill|Dhillon|Chan|Lam|Park|Kim'),
  GB: names('Clarke|Taylor|Hughes|Morgan|Ahmed|Smith|Jones|Williams|Brown|Davies|Wilson|Evans|Thomas|Johnson|Roberts|Walker|Wright|Robinson|Thompson|White|Edwards|Green|Hall|Wood|Jackson|Lewis|Harris|Cooper|King|Baker|Harrison|Allen|Ward|Scott|Stewart|Murray|Reid|Fraser|Campbell|MacDonald|Robertson|Ross|McLean|Griffiths|Jenkins|Lloyd|Price|Owen|Parry|Patel|Khan|Ali|Shah|Singh|Hussain|Begum|Murphy|Kelly|O’Brien|Walsh'),
  AU: names('Walker|Kelly|Nguyen|Brown|Singh|Smith|Jones|Williams|Wilson|Taylor|Johnson|White|Martin|Anderson|Thompson|Thomas|Lee|Harris|Ryan|Robinson|Roberts|Hall|Wright|Evans|Campbell|Edwards|Scott|Stewart|Morris|Green|Baker|Wood|Mitchell|Young|King|Turner|Clarke|Cooper|Ward|Jackson|Hill|Hughes|Moore|Allen|Lewis|McDonald|Davies|Collins|O’Brien|Bennett|Patel|Chen|Li|Wong|Zhang|Kaur|Shah|Hussain|Riley|Murphy'),
  FR: names('Moreau|Dubois|Laurent|Lefèvre|Bernard|Martin|Thomas|Petit|Robert|Richard|Durand|Leroy|Simon|Michel|Garcia|Roux|Vincent|Fournier|Morel|Girard|André|Mercier|Dupont|Lambert|Bonnet|François|Martinez|Legrand|Garnier|Faure|Rousseau|Blanc|Guérin|Muller|Henry|Roussel|Nicolas|Perrin|Morin|Mathieu|Clément|Gauthier|Dumont|Lopez|Fontaine|Chevalier|Robin|Masson|Sanchez|Gérard|Nguyen|Benali|Diallo|Traoré|Diop|Benoit|Boucher|Picard|Colin|Briand'),
  DE: names('Weber|Fischer|Schneider|Klein|Hoffmann|Müller|Schmidt|Meyer|Wagner|Becker|Schulz|Schäfer|Koch|Bauer|Richter|Wolf|Schröder|Neumann|Schwarz|Zimmermann|Braun|Krüger|Hofmann|Hartmann|Lange|Schmitt|Werner|Schmitz|Krause|Meier|Lehmann|Schmid|Schulze|Maier|Köhler|Herrmann|König|Walter|Mayer|Huber|Kaiser|Fuchs|Peters|Lang|Scholz|Möller|Weiß|Jung|Hahn|Vogel|Yilmaz|Demir|Kaya|Özdemir|Celik|Öztürk|Kurt|Aydin|Arslan|Nowak'),
  ES: names('García|López|Martín|Sánchez|Romero|Rodríguez|González|Fernández|Pérez|Gómez|Ruiz|Hernández|Jiménez|Díaz|Moreno|Álvarez|Muñoz|Alonso|Gutiérrez|Navarro|Torres|Domínguez|Vázquez|Ramos|Gil|Ramírez|Serrano|Blanco|Molina|Morales|Suárez|Ortega|Delgado|Castro|Ortiz|Rubio|Marín|Sanz|Iglesias|Núñez|Medina|Garrido|Cortés|Castillo|Santos|Lozano|Guerrero|Cano|Prieto|Méndez|Cruz|Calvo|Vidal|Ferrer|Soler|Puig|Serra|Roca|Pujol|Fuster'),
  IT: names('Rossi|Russo|Ferrari|Ricci|Romano|Bianchi|Marino|Greco|Bruno|Gallo|Conti|De Luca|Mancini|Costa|Giordano|Rizzo|Lombardi|Moretti|Barbieri|Fontana|Santoro|Mariani|Rinaldi|Caruso|Ferrara|Galli|Martini|Leone|Longo|Gentile|Martinelli|Vitale|Lombardo|Serra|Coppola|De Santis|D’Angelo|Marchetti|Parisi|Villa|Conte|Ferraro|Ferri|Fabbri|Bianco|Marini|Grasso|Valentini|Messina|Sala|De Angelis|Gatti|Pellegrini|Palumbo|Sanna|Farina|Rizzi|Monti|Cattaneo|Catania'),
  BR: names('Silva|Santos|Oliveira|Souza|Lima|Pereira|Ferreira|Costa|Rodrigues|Almeida|Nascimento|Alves|Carvalho|Araújo|Ribeiro|Martins|Gomes|Barbosa|Rocha|Dias|Teixeira|Correia|Mendes|Castro|Cardoso|Andrade|Moreira|Nunes|Marques|Machado|Freitas|Fernandes|Vieira|Santana|Ramos|Batista|Moura|Cavalcanti|Monteiro|Pinheiro|Campos|Farias|Medeiros|Barros|Azevedo|Fonseca|Dantas|Cunha|Tavares|Borges|Sales|Queiroz|Guimarães|Peixoto|Reis|Assis|Siqueira|Vasconcelos|Brito|Lopes'),
  IN: names('Sharma|Patel|Mehta|Rao|Khan|Singh|Kumar|Gupta|Shah|Verma|Agarwal|Jain|Malhotra|Kapoor|Bhatia|Chopra|Sethi|Khanna|Arora|Nair|Menon|Pillai|Iyer|Iyengar|Reddy|Naidu|Murthy|Raman|Krishnan|Rajan|Desai|Joshi|Kulkarni|Deshmukh|Patil|Chavan|Bose|Banerjee|Mukherjee|Chatterjee|Das|Dutta|Ghosh|Sen|Roy|Dey|Gogoi|Bora|Saikia|Baruah|Ahmed|Ali|Hussain|Ansari|Qureshi|Sheikh|Thomas|D’Souza|Fernandes|Varghese'),
  JP: names('Sato|Suzuki|Takahashi|Tanaka|Watanabe|Ito|Yamamoto|Nakamura|Kobayashi|Kato|Yoshida|Yamada|Sasaki|Yamaguchi|Matsumoto|Inoue|Kimura|Hayashi|Shimizu|Yamazaki|Mori|Abe|Ikeda|Hashimoto|Yamashita|Ishikawa|Nakajima|Maeda|Fujita|Ogawa|Goto|Okada|Hasegawa|Murakami|Kondo|Ishii|Saito|Sakamoto|Endo|Aoki|Fujii|Nishimura|Fukuda|Ota|Miura|Fujiwara|Okamoto|Matsuda|Nakagawa|Harada|Ono|Tamura|Takeuchi|Kaneko|Ueda|Morita|Hara|Shibata|Sakai|Kudo'),
  ZA: names('Dlamini|Nkosi|Botha|Naidoo|Molefe|Ndlovu|Khumalo|Zulu|Mthembu|Mokoena|Mabena|Sithole|Dube|Mahlangu|Ngcobo|Mbatha|Buthelezi|Mkhize|Zwane|Hadebe|Kekana|Maseko|Baloyi|Chauke|Mabunda|Mulaudzi|Tshabalala|Mofokeng|Mahloko|Mabaso|Mthethwa|Gumede|Cele|Zondi|Nene|Madonsela|Msimang|Vilakazi|Mnguni|Van der Merwe|Van Wyk|Du Plessis|Pretorius|Nel|Fourie|Jacobs|Visser|De Klerk|Coetzee|Williams|Smith|Petersen|Daniels|Adams|Isaacs|Jacobsz|Govender|Pillay|Maharaj|Ntuli'),
};
