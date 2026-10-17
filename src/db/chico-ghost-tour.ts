// Chico Ghost Tour, from the research handoff and research/chico_ghost/MASTER_RESEARCH.md. Copy is told in the
// voice of campfire ghost-story books, but stays hedged: stops without a primary source are framed as legend,
// and each source description carries its verification status.
// Coordinates are from OSM geocoding except where marked APPROX (verify on site).

export type SeedStop = {
  key: string;
  title: string;
  lat: number;
  lng: number;
  radiusM?: number;
  story: string;
  tags?: string[];
  sources: { title: string; url: string; kind?: "link" | "image" | "document" | "audio" | "video"; description?: string }[];
};

const CNR = "https://www.newsreview.com/chico/content/haunts-and-hoaxes/764293/";
const ORION = "https://theorion.com/106007/arts/echoes-of-spirits-chico-haunted-tours/";
const ANN = "https://www.actionnewsnow.com/news/haunted-chico-tour-blends-history-and-the-supernatural/article_821e89bd-4802-472b-8b9e-b3f42f846fda.html";

const ER1984 = "https://www.newspapers.com/image/680607897/";
const ER1986 = "https://www.newspapers.com/image/680905714/";
const CNR2001 = "https://www.newsreview.com/chico/content/chicos-urban-legends/6795/";
const NPA2013 = "https://nationalparanormalassociation.blogspot.com/2013/01/finding-chico-californias-real-haunted.html";
const TUNNELS2007 = "https://web.archive.org/web/20160321083830/http://www.chicoer.com:80/article/ZZ/20071001/NEWS/710019836";

const er1984 = (note: string) => ({ title: "Few local ghosts around to join trick or treaters (Enterprise-Record, Oct 31, 1984)", url: ER1984, kind: "document" as const, description: `Period newspaper page, read directly. ${note}` });
const er1986 = (note: string) => ({ title: "Stories from the 'paranormal hotbed' (Enterprise-Record, Oct 29, 1986)", url: ER1986, kind: "document" as const, description: `Period newspaper page, read directly. ${note}` });
const otr1988 = (page: string, id: string) => ({ title: `A Haunted House? (Off the Record, Enterprise-Record, Oct 26, 1988, ${page})`, url: `https://www.newspapers.com/image/${id}/`, kind: "document" as const, description: "Period newspaper page, read directly. By Perry Lake. The article withholds the house's address at the owner's request." });
const cnr2001 = (note: string) => ({ title: "Chico's urban legends (Chico News & Review, Nov 8, 2001)", url: CNR2001, description: `Secondary source. ${note}` });
const npa2013 = (note: string) => ({ title: "Finding Chico, California's real haunted locals (National Paranormal Association, Jan 22, 2013)", url: NPA2013, description: `Blog repost of a Chico Enterprise-Record piece; original date unknown. ${note}` });
const cnr = (note: string) => ({ title: "Haunts and hoaxes (Chico News & Review, Aug 28, 2008)", url: CNR, description: `Secondary source, on record. ${note}` });
const orion = (note: string) => ({ title: "Echoes of spirits: Chico Haunted Tours (The Orion, Oct 5, 2025)", url: ORION, description: `Secondary source. ${note}` });
const ann = (note: string) => ({ title: "Haunted Chico tour blends history and the supernatural (ActionNewsNow, Oct 23, 2025)", url: ANN, description: `Secondary source. ${note}` });

export const chicoGhostTour = {
  slug: "chico-ghost-tour",
  title: "Chico Ghost Tour",
  city: "Chico, CA",
  lat: 39.7285,
  lng: -121.8405,
  theme: "deco-night",
  status: "draft" as const,
  tags: ["Ghost stories", "Walkable", "Local history"],
  summary: "A walk through downtown Chico's haunted hotels, theaters and bars: a rock-throwing ghost that made national news in 1922, a boy who stares from the back of the Senator, and a balcony ghost with strong opinions about carpet.",
  story: [
    `Chico was drawn on paper before it was built. John Bidwell laid out its streets, and the people who came after filled them with stories: a salesman who will not stop knocking, stones with no thrower, fish from a clear sky.`,
    `This tour walks you through them at dusk, a little afraid, a little curious. Keep your voice low. Some of these houses are listening.`,
    `We tell each story the way it was told to us, and then we tell you how much of it we could prove. Some stops rest on old newspapers and named witnesses. Some are legend, told by guides and repeated in the press. We mark which is which. A recurring local motif: guide Dustin Vaught says there have been 17 police reports of chupacabra sightings downtown since 1978 (unverified; no records request has been made).`,
  ].join("\n\n"),
  stops: [
    {
      key: "diamond",
      title: "Hotel Diamond",
      lat: 39.72828, lng: -121.84035,
      story: [
        `We end where the lamps are already lit. The Hotel Diamond has stood at Fourth and Broadway since 1904, when James Franklin Morehead raised it for travelers off the rail line, and it has been taking in strangers ever since. Not all of them, the story goes, ever checked out.`,
        `Local legend tells of a traveling salesman who took a room on the third floor. One night, he ended his own life there.`,
        `Ever since that fateful day guests say that someone still comes calling. A knock sounds at the door. When you open it, there he stands: a man in a suit, sample case in hand, eager to sell you something you did not ask for. Initially hesitant you turn to get your wallet anyway, because he is so very polite. And when you look back, the hallway is empty.`,
        `He is not alone. A woman in white is said to drift behind the stained-glass windows, and to wait in the dark of the parking garage next door. Ghost hunters who sat up with recorders claim to have caught a voice barely peeking through the silence: "evil spirit, stay away, the tree." Though no one has been able to say which tree is being referred to it's no doubt that one of the many trees nearby most likely holds a dark secret.`,
        `Look up at the third-floor windows as you go. Check each one. Then check again. You just might see a permanent resident beckoning you to come join them.`,
      ].join("\n\n"),
      sources: [
        orion("Source for the salesman, woman in white and recording."),
        ann("Corroborates the tour's version of the story."),
        { title: "Hotel Diamond (Downtown Chico)", url: "https://www.downtownchico.com/hotels_hotel-diamond-425.htm", description: "Building history only, no ghost claims." },
      ],
    },
    {
      key: "stoble",
      title: "Stoble Coffee",
      lat: 39.7297, lng: -121.8362, radiusM: 60, // APPROX: did not geocode
      story: [
        `Some ghosts show you a face. This one prefers to make a mess.`,
        `When workers began tearing into this old Broadway building, the trouble started small. A hammer slid off the scaffolding. Then another. Tools fell, with no hand to push them and no wind to blame. And then a few of the men looked up and saw him: a man in a brown suit, standing where no one could stand, watching them work.`,
        `They looked away. They looked back.`,
        `He was not there.`,
        `Nobody has ever learned his name. The workers have stayed anonymous, which is how these stories tend to survive.`,
        `Now, about the floor on which those workers stood. Old-timers will swear that the cellars under Broadway are all joined, one dark room opening into the next. The truth is smaller, and stranger. The historian John Nopel said the basements of the shops down by First and Broadway really are connected. The city's community development director guessed it dated from the days when one owner held several buildings at once. And Jerry Brayton, whose parents kept a shop downtown when he was a boy, remembers the coal chutes that let a man climb down into those cellars, and says that part of downtown used to sit ten feet lower than it does today.`,
        `Ten feet. Think about that. The street you are standing on is not the street the first merchants walked.`,
        `What lies down there now? Probably nothing. Probably. The grander tales, of tunnels that crossed the whole town, are older and shakier, but as time passes the truth gets harder and harder to discern.`,
      ].join("\n\n"),
      sources: [
        ann("Only source for the man in the brown suit; no named witnesses."),
        cnr2001("Nopel, city planner Clif Sellers and Jerry Brayton on the connected basements, coal chutes and the lower street level."),
        { title: "But This is Chico: Belief in underground tunnels is alive and well (Enterprise-Record, Oct 1, 2007)", url: TUNNELS2007, description: "Skeptical column; repeats Nopel's one-block claim for Broadway between First and Second." },
      ],
    },
    {
      key: "silberstein",
      title: "Silberstein Building",
      lat: 39.7289, lng: -121.8385, radiusM: 60, // APPROX: did not geocode
      story: [
        `After the Civil War, grief had nowhere to go, and so it went looking for the dead. Across America, families who had buried sons in far-off fields began to sit in darkened parlors with their hands flat on tables, waiting for knocks. Spiritualism had become a craze and Chico was not immune.`,
        `They say this building, the Silberstein, hosted séances on a regular schedule. Candles lit. Curtains drawn. Strangers holding hands in the dark, asking questions of the air.`,
        `And what did the air say?`,
        `Sadly, we have no transcripts so any answers were as ephemeral as a summer breeze. All that remains is a a rumor that in 1912 the city grew so uneasy that it required a permit to hold a séance at all.`,
        `The craze did not fade quietly, either. In the spring of 1922 spiritualists would sit up all night in a warehouse by the train depot, leaving us to ask ourselves who they hoped would answer.`,
      ].join("\n\n"),
      sources: [orion("Source for the séances and the 1912 permit ordinance. The ordinance text is unverified.")],
    },
    {
      key: "rocks",
      title: "The Rock-Throwing Ghost (City Plaza)",
      lat: 39.72831, lng: -121.83888, radiusM: 80,
      story: [
        `The City Plaza and surrounding area was the home of Chico's most well documented near paranormal event.`,
        `It began down by the train depot around Orange Street and 6th, at a warehouse run by two men named Priel and Charge. One spring day a rock dropped onto the tin roof. It clattered, rolled, and fell off the edge. Then another. Boys, everyone figured. Somebody's boys.`,
        `Then came March 9, 1922. The sky opened. A whole volley of stones came down on that roof: some as small as a pea, some as big as a baseball. And here is the strange part, the part that kept grown men awake. They fell **straight down**. Not thrown at an angle, the way a boy with a sling would throw them. Straight down, as if the air itself had let go. And whether the day was wet or dry, the rocks were always dry.`,
        `The town sent for a geologist, C.K. Studley of Chico State. He examined the stones (rather hastily, he admitted) and wrote a report. That report reads as follows
> "The samples of rocks which I have examined rather hastily aren't such as one would find in any stream bed along the Sacramento Valley, where the stream has a velocity great enough to carry particles of their size, no small sluggish stream would carry more than grains of sand, but either Big Chico Creek or Little Chico Creek is capable of carrying gravel as large as the samples. All of the evidence seems to point to one of our local streams as being the source of supply of the missiles so mysteriously hurled through the air. The samples are not of a free-moving variety, and could not have been expected to transport themselves...they were not of meteoric origin, as seems to have been hinted, because two of them show signs of cementation, either natural or artificial, and no meteoric factor was ever connected with a cement plant. A stone of meteoric origin would show signs of recent melting, and not signs of wear, as is plainly shown on all of these specimens." With nothing more than that to go on the speculations began to flow with people deeming the source everything from witchcraft, to ghosts, to pranksters. Newspapers started picking up the story and eventually the story spread all over the world.`,
        `Soon enough the crowds came, hoping to catch a glimpse of the phenomenon. Hundreds stood around that warehouse watching the roof. The trains, they say, began stopping a little longer at the depot so that passengers could climb down and look. One day a whole crowd off a train was gawking when a rock came bounding down the roof and into them. They ran for the train, clawing and pushing to get back aboard.`,
        `The spiritualists held séances. An evangelist came up from Oakland, pitched a tabernacle, and told the people that Satan had a hand in it. A promoter offered Mr. Charge $10,000 for the secret, so they could take the show on the road. Charge had to say no as he did not know the secret himself.`,
        `The law, meanwhile, was not amused. A John Doe warrant was sworn out for the arrest of the ghost. The constable went door to door, climbing trees and poking behind fences, looking for a catapult. One lunch hour he walked through the warehouse with Mr. Charge, both of them alone in the building, and said it was all a hoax. "I don't think there's anything to it," he said.`,
        `And just at that moment an orange hit him in the back of the neck. From *inside* the empty warehouse.`,
        `Charge began to tell of even stranger things happening in the warehouse. An elevator that lifted at one end, with no hand on it. An old tire that rolled out between the sacks and nearly hit a man. Nuts flying across the floor. One night he sat in the dark with some friends, waiting, when suddenly a pool of blue light, four feet square, spread across the floor, flared up, and was gone. Another night some spiritualists stayed in the warehouse until two in the morning, when Charge's telephone rang. "You get down here as quick as you can," they said. "We're scared." They had seen a man hanging from a rafter. Charge went down and found only the moonlight through a window, throwing a shadow. "I told you not to take any liquor in there," he said.`,
        `Downtown, the merchants began nailing boards over their windows, convinced the rocks would come for Main Street next.`,
        `In late March, they did. Rocks pelted Main Street, potentially on the very ground where you are standing.`,
        `At last the constable, Teddy Peck, hired the Pioneer Aviation Company of Sacramento to fly over the warehouse roof and search. The papers printed the news. And the ghost wrote back. Researcher Hector Lee read the letter over the radio on the air years later:`,
        `> "Mr. Teddy Peck, dear sir. Well, Ted, the ghost has walked. That is, I'm going away from Chico for a while on business. Thanks for the courtesy you have shown me, and thanks to Mr. Priel and Mr. Charge and Son for the use of their roof as a target... I see by the papers this morning that you're going to hunt me by airplanes, so I guess I'll have to quit this time. This is the only way in the world you could have found me."`,
        `It was dated March 24, 1922, and signed **the Ghost**. He said he was testing an invention, a catapult. He said no one had been near him all those months, and that he'd had quite a kick out of it. And he promised that when his patent deal was done, he would come back to Chico to live, and "the first one who throws a rock on my roof, I'll beam him one."`,
        `That should have been the end.`,
        `But some people say that after the letter, from time to time, rocks still fell on that warehouse. Nobody ever saw the ghost. Nobody ever caught him.`,
        `Even after the supposed retirement of the Rock-Throwing Ghost, the legend lived on and made the rounds. The New York Times carried the story. The writer Charles Fort, who made a career of collecting what science would not, set it in his book *New Lands* in 1923. In December of 1960 ABC dramatized it on the television series *One Step Beyond*, and a year or so later, Hector Lee told it on regional radio show "Tales of the Redwood Empire". You can still listen to that recording in the Chico State library archives.`,
        `The story's ending even carried into the future when sixty years later, the last of the pranksters is said to have confessed on his deathbed. John Gallardo of the Chico Heritage Association relayed the story of this last confessional from a man who was a kid at the time and, he says, helped pull off the falling rock phenomona. Which means that for most of a century, someone knew. Someone sat on that secret and let the town wonder.`,
        `So tonight, if something clatters on a roof, look up. It is probably a boy with a catapult.`,
        `Probably.`,
      ].join("\n\n"),
      sources: [
        { title: "\"The Rock-Throwing Ghost of Chico\" by Hector Lee (Calisphere)", url: "https://calisphere.org/item/84cd25fb2abe436746a475b8a97c3f5e/", kind: "audio", description: "Primary source, confirmed. Episode 14 of Tales of the Redwood Empire (KSRO radio, aired Dec 17, year unconfirmed; probably 1961), held at Meriam Library Special Collections. Source for Studley's report, the orange, the elevator, the blue light, the hanging-man shadow, the airplane and the March 24 letter." },
        { title: "Hector Lee radio episode (Internet Archive)", url: "https://archive.org/details/cchis_000061", kind: "audio", description: "Primary source, confirmed. Same recording on archive.org." },
        { title: "Hector Haight Lee papers, 1945-1988 (Archives West)", url: "https://archiveswest.orbiscascade.org/ark:80444/xv99011", kind: "document", description: "Finding aid. Likely holds the typescript of this episode; not yet checked." },
        { title: "California Digital Newspaper Collection: Chico Record 1906-1948", url: "https://cdnc.ucr.edu/?a=cl&cl=CL1&sp=CR", description: "Unverified. Free, searchable; try \"ghost\", \"rocks\", \"Charge\" for Nov 1921 to Mar 1922." },
        { title: "Chico Record, Jan 27, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19220127.2.13", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Jul 6, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19220706.2.63", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Aug 8, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19220808.2.75.3", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Dec 2, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19221202.2.14", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Dec 6, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19221206.2.6", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Dec 30, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19221230.2.15", description: "Unverified: indexed issue page, content not yet read." },
        cnr("Quotes John Gallardo, president of Chico's Heritage Association, on the deathbed confession, and reports rocks on Main Street later that March."),
        { title: "\"Where Are They?\", One Step Beyond (ABC, Dec 13, 1960)", url: "https://en.wikipedia.org/wiki/One_Step_Beyond", kind: "video", description: "Documented. Season 3, episode 12; dramatizes the Chico rock shower alongside an unrelated 1917 story. Link is the series page, not the episode." },
        { title: "Charles Fort, New Lands (1923), ch. 26", url: "http://www.resologist.net/lands226.htm", kind: "document", description: "Cites the San Francisco Examiner (Mar 14, 1922) and the 1878 fish fall. Fort's citations are not independently verified." },
        cnr2001("Historian John Nopel on the warehouse near the depot, the merchants boarding up windows and the all-night watch; reports that some rocks were said to be warm or oval."),
      ],
    },
    {
      key: "senator",
      title: "Senator Theatre",
      lat: 39.72818, lng: -121.83749, radiusM: 50, // OSM geocode; on Main St near E 5th
      story: [
        `This is the Senator, and if you ask around downtown, there are haunts here that go back nearly a hundred years.`,
        `The story most people tell goes back to 1981. A reporter from the Chico Enterprise-Record sat down with the theater's manager, John Enloe, several of his employees, and a reserve sheriff's deputy, and they told him what they had seen. It was quite a list.`,
        `Lights that flickered on and off. White shapes in the basement. A forceful something in the projection booth. An air conditioner that slowly crushed in on itself, by itself, while someone watched. And an old man in the mirror behind the candy counter, where no old man was standing.`,
        `Enloe saw them most. He said that even when no one was in the theater, it was never empty.`,
        `His favorite was a boy. A small Native American boy, in clothes from the 1890s. The boy would walk into Enloe's office whenever he was interviewing someone for a job, and would stand there, head cocked to one side, smiling. Staring. "It's very irritating sometimes," said Enloe.`,
        `His niece, Andrea Ryland, worked the theater too. One day she was leading some friends through what she called the bowels of the building, down near the basement, when she turned around they noticed the area filling up with an ethereal substance. "It was white. It was sort of like a fog," she said. The whole group ran for the nearest exit.`,
        `Then there was the night in the projection booth. Enloe was alone when something came in and, as he put it, practically threw him against the wall. It left. It came back. It came back several times that evening. "I saw the form," he said. "I couldn't tell you what it was."`,
        `Why here? Enloe had no explanation. He wondered whether a Native American boy might be buried under the building. He mentioned that people had died in it since it was built in 1927, one of them a man who fell from the tower. That is what the staff believed. No one has ever shown that any of it is true.`,
        `Not everyone agreed. In 1984 the Enterprise-Record itself called Chico "sadly lacking in ghosts," and said the Senator's apparition had been seen only once. In 1986 a newer manager, Wayne Key, said he had worked the Senator four years and seen nothing. "I imagine people see ghosts anywhere they want to," he said.`,
        `But the stories did not stop.`,
        `In the late 1990s, an artist named Matt Loomis was painting a mural in a Senator office, alone, at night. Headlights slid across the walls. "Light was doing weird things," he said, "but light always does weird things there." Then he heard footsteps, slow and unhurried. And whistling. He walked down to the lobby, and saw no one. When he climbed back up to the second floor, he saw her: a woman, from the legs down, sitting on one of the benches with her legs crossed and her hands resting on her knee.`,
        `He said he was not painting there alone anymore.`,
        `People told other things. A custodian quit after creepy nights alone in the building. One man felt a hand on his shoulder while tiles flew around him. A mop bucket floated in the air. Once, people on the stage felt a huge presence just before a counterweight began to move by itself. The man running the theater as a performance space said he came every night and said, "Bring it on."`,
        `One more thing. The building has apartments in it, with their own door on the side. According to one retelling, a young man once died in one of them, and he did not realize it. He kept wandering the theater, looking for someone to talk to. A couple with an interest in the paranormal claimed to have redirected his spirit. After that locked doors in the theater, staff said, would sometimes jump, as if someone pushed from the other side. Once Chico resident who grew up here remembered the balcony bathroom upstairs: they would not go in alone, and some of their friends ran out of it in fear.`,
        `Then the theater was remodeled in the early 2000s. Since then, the story goes, no apparitions have been reported.`,
        `Maybe the boy finally moved on.`,
        `Or maybe he just stopped bothering to interrupt the interviews.`,
      ].join("\n\n"),
      sources: [
        er1986("Retells the 1981 Roger Aylworth interview with manager John Enloe, Andrea Ryland and others; includes Wayne Key's skeptical comment."),
        er1984("Calls the Senator ghost seen only once and quotes Ted Meriam on Chico's quiet ghosts."),
        cnr2001("Matt Loomis's mural story, the custodian, the mop bucket and the stage presence."),
        npa2013("Location on Main near East Fifth, the apartment ghost, locked doors that jump, and a reader's balcony-bathroom memory (2015 comment). Unverified."),
      ],
    },
    {
      key: "bear",
      title: "Madison Bear Garden",
      lat: 39.72912, lng: -121.84256,
      story: [
        `The building that houses the Madison Bear Garden has had various owners over the year but people say there have been more than one resident who stayed on.`,
        `It was once the home of Franklin Lusk, lawyer to John Bidwell, the man who founded Chico and laid out its streets. Tradition holds that Bidwell liked to drink here late into the night, and that his wife Annie, a devoted temperance woman, did not approve. Annie, as it turned out, had the last word. After John died, she made the house the headquarters of the Prohibition Party.`,
        `A man's drinking den, turned into a temperance hall and then, a century later, turned back into a bar. If a ghost lingers here, it may be the man who has not stopped being annoyed about it.`,
        `Bartenders say something still keeps watch over the taps. A hand rests on a shoulder when no one stands behind. And there is a second presence, lighter and sadder: a little girl, said to have died in a carriage accident on Salem Street.`,
        `Other stories also persist. A chef alone in the kitchen heard a child laughing. A coworker, thinking a customer's daughter had wandered in, followed a little girl into the bathroom only to find that the bathroom was empty.`,
        `Before you go, look down. Near the base of the building, set into the brick, are decorative vents: a large inscribed five-pointed star flanked by two smaller stars. Passersby have read them as Masonic, occult, or both. The more mundane answer is ventilation and the Victorian style to make even a grate look fancy. Still, a pentagram at ground level, on a drinking man’s house that became a temperance headquarters, in a location with multiple ghostly encounters is hard to walk past without grinning.`,
      ].join("\n\n"),
      sources: [
        orion("Source for the Lusk house story, the bartender and the little girl. No property record found yet."),
      ],
    },
    {
      key: "elrey",
      title: "El Rey Theatre",
      lat: 39.72955, lng: -121.84208,
      story: [
        `Every ghost tour needs one stop that earns its fright the honest way. While not as rich in hauntings or apparitions, the building has a history that needs no help.`,
        `It began as the Majestic, commissioned by the Chico Elks Lodge and opened in the spring of 1906, with an opera company on the stage and, soon after, flickering newsreels of the San Francisco earthquake on the screen. Over the years it changed its name to the National, then the American. Then, on the night of October 24, 1946, fire gutted the interior. An arsonist was reportedly caught about a week later .`,
        `The theater came back in 1948 as the El Rey, taking its name from a marquee sign the owners already owned from a Bay Area theater that had also burned. A Carmel artist named Martin Raventstein painted fairy murals on the walls that year. Fairies. In a room that had just burned down.`,
        `Chico's old theaters collect ghost stories the way other buildings collect dust. The Senator has them. The Blue Room has them. The El Rey, as far as we can find, has none. A fair warning for anyone searching later: other El Rey theaters in other cities carry haunting reputations, and we have not found one that belongs to Chico's.`,
        `Today the building is for sale, and a local group hopes to buy and restore it. Maybe there is a ghost there simply waiting for the curtain to rise.`,
      ].join("\n\n"),
      sources: [
        { title: "Save the El Rey: history", url: "https://savetheelrey.com/front-page-2/", description: "Primary-quality history, confirmed." },
        { title: "El Rey Theater (Explore Butte County)", url: "https://www.explorebuttecounty.com/places/el-rey-theater", description: "Confirmed history." },
        { title: "El Rey Theatre (Cinema Treasures)", url: "https://cinematreasures.org/theaters/7563", description: "Confirmed history." },
      ],
    },
    {
      key: "blueroom",
      title: "Blue Room Theatre",
      lat: 39.73045, lng: -121.8419, // address assumed 139 W 1st St
      story: [
        `The Blue Room stands on ground with a long memory. For more than a century a Masonic Temple stood here, its members climbing the stairs for rituals they kept to themselves. Then the temple was gone, and actors came to climb the same ground.`,
        `Jeremy Votava was the theater's technical director in the early 2000s, and he worked late, alone, the way theater people do. Used to the normal creaks and groans of an old theater, one night there was something more afoot. Votova told the Chico News & Review of his account.`,
        `Most nights, he began, it was little things: strange noises, the feeling of being watched.`,
        `Then one night he was up working on the lights, and he heard footsteps going up the stairs. Slow. Ordinary. Someone coming up.`,
        `He went down to look.`,
        `No one was there. And the door was locked.`,
        `Who walks there? A worshipper, an actor, an audience member who never left their seat: no one can say. Votava himself, to his credit, remarked that paint fumes and dark rooms can play tricks on a tired mind. Still, Votava is the best kind of witness: a man who saw nothing, doubts himself, but still can't quite say it was pure imagination.`,
      ].join("\n\n"),
      sources: [
        cnr("Named, on-record quote from Jeremy Votava."),
      ],
    },
    {
      key: "laxson",
      title: "Laxson Auditorium (Chico State)",
      lat: 39.72992, lng: -121.8437,
      story: [
        `Walk into any large empty auditorium and you will feel the room watching you. At Laxson, the people who work here say it is not only a feeling.`,
        `The story is of an elderly woman, a theatergoer, who hangs about in the balcony. Staff who have worked late nights in the empty house say they have felt her. Some say they have seen her. "I don't think she's threatening," one of them told a student reporter. "I think she's just there." One staffer reported seeing her as they were looking near the chandelier that sits in the center of the auditorium. They also reported watching the Juliet curtains up in the balcony move even when there was no draft. If you are sitting through a performance, they say, turn around and look at the back. She might be there.`,
        `A former technical director, Steve Ellis, met her many times, relaying a story of how she influenced the current look of the theater.`,
        `In 2006 the auditorium was being refitted. New seats, new carpet. The house was a wreck, the old carpet pulled up, and the staff had to choose five thousand square feet of carpet from a sample about the size of a doormat. A big decision, and nobody wanted to be wrong. Three staff members from Chico Performances and two men from the theater department stood in that empty house. One of them laid a sample they were considering beside a chair and said, "So, what do you think?"`,
        `And a light bulb exploded.`,
        `High up in the balcony chandelier, three stories above them, a bulb popped and came down to the floor with a crash. They all looked up. Nobody said anything for a while.`,
        `"Let's find another carpet," somebody said.`,
        `Two weeks later they came back with a different sample. They laid it down. They looked up at the balcony, and they asked it again: "So, what do you think?" And all of them backed away, and waited.`,
        `Nothing happened.`,
        `That is the carpet on the floor today. They say they have the ghost to thank for it.`,
        `Who was she? A student? A neighbor who came to every show? Some guess she may be left over from the Bidwell days. Nobody knows. They are sure of one thing: nobody died building this theater, and nobody is buried under the seats. Whoever she is, she has outlasted every show.`,
        `She is not the only one on campus. A custodian in Butte Hall, they say, once sat down on a padded bench in the lobby to rest, and felt that he was not alone. He turned. A woman sat at the other end of the bench. She never spoke. When he gasped, she faded out of sight. And in Trinity Hall, another custodian walked into the second-floor gallery one night and felt a sudden chill, and found doors he had just unlocked locked again.`,
        `Campus lore has a darker neighbor too. The chupacabra legend places the creature around Kendall Hall and here, perhaps even using the rumored tunnels beneath the campus to traverse it.`,
        `Whatever or whomever walks the halls of Chico State, they seems to prefer the quiet. The balcony at Laxson, a bench in Butte Hall, a locked door in Trinity: places where someone works late and alone, and the building decides to keep them company. We can’t tell you who she was, or whether the chupacabra is anything but a good campus rumor. But before you leave, step outside to the statues at Ayres Hall and look up. The people who work here say that from this spot you have a clear line of sight to the balcony where she is said to sit. If she is up there, she may be looking back. She has been watching this campus longer than any of us`,
      ].join("\n\n"),
      sources: [
        { title: "Rumor Has It: 10 Chico State Myths Explored (Chico State Today, Nov 13, 2021)", url: "https://today.csuchico.edu/rumor-has-it-10-chico-state-myths-explored/", description: "Secondary source for the balcony woman and the chupacabra legend. The carpet story comes from a staff interview (audio, not yet linked)." },
        npa2013("Source for the Butte Hall bench and Trinity Hall doors. Unverified; custodians unnamed."),
      ],
    },
    {
      key: "stansbury",
      title: "Stansbury Home",
      lat: 39.72667, lng: -121.83987,
      story: [
        `Some houses are so lovely that you assume they must be haunted, if only to justify the staring.`,
        `Dr. Oscar Stansbury built this Victorian in 1883, and the National Register of Historic Places listed it in 1974. People will tell you it is haunted. Ask them what happened, and the story thins out. As of 2008 reporting, no one could point to a specific encounter: no footsteps, no figure at a window, no name.`,
        `A reporter that year wondered whether the specters of Victorian houses were watching us from their windows. Then went looking for someone who had seen one. Nobody had.`,
        `Call it the quietest haunting on the tour. Perhaps the ghost is shy. Perhaps the rumor grew from the house itself, with its tall windows and its long, patient look.`,
        `Stand here a minute. Count the windows. See if you feel watched.`,
        `No? Then it is not looking at you.`,
        `It is looking at the person standing next to you.`,
      ].join("\n\n"),
      sources: [
        { title: "Stansbury Home (City of Chico)", url: "https://chicoca.gov/__catapult_pages/0e95208f-5002-47e7-b49f-c6e36e731f3b/Stansbury-Home.html", description: "Building history." },
        cnr("Notes the rumor but no specific encounter."),
      ],
    },
    {
      key: "bidwell",
      title: "Bidwell Mansion",
      lat: 39.73236, lng: -121.84356,
      story: [
        `At the end of the downtown streets, in a house of pale stone and tall windows, lived the couple who made Chico what it is.`,
        `John and Annie Bidwell are the founders. Every block you will walk came out of his plan, but much of the town's character, its temperance cause, came in large part out of hers. If any building in Chico ought to be haunted, this is it. In 1984 the Enterprise-Record agreed: if Chico were to have a resident spook, it said, the most likely place would be here. Ted Meriam, a lifelong resident and former mayor, insisted otherwise. Chico's ghosts, he said, must be a "satisfied and complacent" lot, because they never made any noise.`,
        `In 1980, a Chico woman named Sherry Edmiston, with an interest in the paranormal, asked the state for permission  to conduct tests in the house and see whether any part of John Bidwell's personality lingered in the rooms he built. The state said no. Area manager of the Department of Parks and Recreation, Cliff Wade, wrote Edmiston a letter asking what benefit the state could expect from such an investigation. And then he added a line that has been repeated ever since:`,
        `> "There are those that say that if, in fact, there are ghosts in the mansion, they should be left alone."`,
        `In another instance, a local couple who claimed to be psychic researchers heard rumors of disembodied voices and other strange goings-on in the building. After visiting the mansion in daylight and "sensing" that something out of the ordinary was going on, the pair made a formal request to state park officials for a "special use" permit. They wanted to spend the night in the mansion with recording equipment in the hopes of catching something bumping.  `,
        `Again the state rejected the request, allegedly remarking in a letter that if there were ghosts in the mansion, they certainly qualified as an endangered species, and should not be disturbed.`,
        `So nobody has ever been allowed to find out the full truth. And as of 2008 reporting, no one could name a specific encounter and the closest thing anyone has found out that might be a little bit interesting is a closet that joins two of the guest rooms.`,
      ].join("\n\n"),
      sources: [
        er1984("Source for Sherry Edmiston's 1980 request, Cliff Wade's reply (quoted) and Ted Meriam's remark."),
        npa2013("Retells the same episode: a couple wanting a night with recording equipment, and a state letter calling ghosts an endangered species. Paraphrase; the 1984 article has the quoted line."),
        { title: "But This is Chico: Belief in underground tunnels is alive and well (Enterprise-Record, Oct 1, 2007)", url: TUNNELS2007, description: "Source for the closet joining two guest rooms." },
        cnr("Notes the rumor but no specific encounter."),
      ],
    },
    {
      key: "goodman",
      title: "Goodman House Bed & Breakfast",
      lat: 39.74095, lng: -121.84737, radiusM: 60,
      story: [
        `Of all the haunted houses in Chico, this one comes with the least enthusiastic hostess. The woman who owned it for years says she never once felt a ghost and is a self proclaimed skeptic. Which makes it all the more interesting that this house has what the Chico News & Review once called one of the best documented hauntings in town.`,
        `The ghost, they say, is George Vogelsang. George lived here about fifty years and died in 1958, at ninety, after a fall down the stairs. But a man does not leave a place he has known for fifty years just because he's left the mortal world.`,
        `In the 1970s, when the building held law offices, the staff reported doors that would not open and files that would not be found. Then, in 2003, a painter was working alone in the basement. He heard footsteps upstairs. Steady, unhurried, as if someone were walking the house they still considered theirs. He climbed the stairs to look.`,
        `No one was there.`,
        `He went back to work. The footsteps started again. He climbed the stairs again. And again. Each time, an empty house.`,
        `One owner, Margo Graham, is a skeptic, and she told the Chico News & Review so. In nearly six years in the house she had never had a ghostly encounter. "He fell down the stairs and died, or maybe he died and then fell down the stairs," she said. "Someone decided it was his ghost."`,
        `And yet. She also had a theory about why it had been quiet during her occupancy. "Maybe he's happy it's back to a house and not law offices anymore."`,
        `Make of the footsteps what you will. If you hear them on the way out, do not look back. It is only the house, saying goodnight.`,
        `Unless, of course, it isn't.`,
      ].join("\n\n"),
      sources: [cnr("On-record quotes from owner Margo Graham.")],
    },
    {
      key: "house",
      title: "The North Chico Haunted House",
      lat: 39.7599, lng: -121.8281, radiusM: 250, // APPROX: the 1988 article withholds the address ("just off East Avenue, about halfway between Pleasant Valley High School and North Avenue")
      story: [
        `This one is not on the walk. It sits miles out, off East Avenue, about halfway between Pleasant Valley High School and North Avenue, and the owner did not want the street number printed in 1988, so we do not know it either. This is a stop to read at home, with the lights on. **Please do not go looking for the house. It is private property, and it may not even be standing.**`,
        `In the fall of 1988 the *Off the Record* magazine ran the story under the headline "A Haunted House?" It was a brick and wood house, painted white with green trim, with walnut trees all around that dropped their nuts on visitors "as if in warning." A young man named Tim Sisco rented it. He had moved in six months before. One by one, his roommates had moved out, because they were nearly spooked to death.`,
        `This is what Sisco said happened.`,
        `The door of the square room upstairs opened and closed by itself. Over and over. A cooler in the long room switched on three times, and it was not plugged in. At the top of the stairs there was a light: a pinkish-blue sphere, the size of a soccer ball, that swelled and shrank and was gone. One day Sisco found bare footprints in the upstairs hall. He had no roommates then. The first ones were small, like a little kid's. After that, they started getting bigger. Finally, they were full-grown.`,
        `A man sang outside. It sounded like opera, with drums and horns and violins, a whole orchestra, and no one was there. Cars would not run right, his or his guests'. Three refrigerators standing in the front yard went haywire. And once, in anger, Sisco laid a dime on the coffee table and dared the ghost to flip it over.`,
        `When he came back, the dime had been turned over. It was lying on the floor.`,
        `The first night he lived there, he looked out the upstairs window and saw something white, flapping in the wind by the walnut tree. He ran out. Nothing there. Two roommates who slept in the square room upstairs "went berserk." One of them said he never liked to go up there; he would sit downstairs as long as he could, until he was so tired he had to.`,
        `Sisco's girlfriend at the time, Shirley Reaves, hated the house from the driveway. She called herself a psychic. In a trance she sensed five people in the house: a father, a teenage girl, a pair of twins, a baby, and something that might have been a cat or a dog. The girl, they decided, was named Lucinda. She was friendly and fond of Sisco. The father was another matter. Reaves said something dark had entered him, and that the children were still afraid of him.`,
        `So they called in the ghostbusters.`,
        `The Northern California Paranormal Research Society, led by a man named Michael Farmer, came on the afternoon of September 17 with three other members. They set up thermometers and motion sensors, like something out of *Poltergeist*. Another psychic, Mara Arraya, arrived with her family. And as the afternoon wore on, flies began to swarm the house, "like a scene from *The Amityville Horror*."`,
        `They sat down with a Ouija board that had been "purified," so the devil could have no control of it. And the planchette began to move.`,
        `It spelled **R-U-D-I-E**. *Are you dead?* They asked if he was sad. **Y-E-S.** Why? **L-E-F-T.** The children had left. It spelled **W-H-Y**, three times over. Then **S-T-A-F**, and they decided it meant *staff*: that he had planted his staff in the backyard, and it had grown into a tree. The very tree where Sisco had seen the white thing flapping. The flies grew thicker. They asked whether anyone else was holding him there, and the board said yes: two animals, a cat and a dog. They asked if he wanted to stay. The board answered **0-2-9**. No one could say what it meant. He wanted the animals dug up.`,
        `So they went out to the backyard at sundown. Arraya walked straight to the tree, though no one had told her which one. The tree stood at the end of a row of stones running diagonally across the yard from the corner of the house, northwest to southeast, against the grain of the property lines. A ley line, someone said. She pressed green crystals to the bark and a crystal ball to her forehead. The wind howled. "The animals cannot be released," she said.`,
        `Seven people stood in that yard. A Christian, a witch, a New Ager, an atheist and a researcher. Each did their own thing, and all worked toward the same end: to seal him in. The wind died. The horses in the yard came up to the fence, and they fed them hay. A good omen, they said.`,
        `But the night was not over. Back at the board, the lights began to flicker. The spirit said he was a high priest of some unknown order. Arraya's nine-year-old daughter, Laura, looked out the window and saw a man in the yard, pointing a rifle at her mother. She felt drawn to him, as if called. The board spelled **J-9-J-9**. A juvenile, nine years old. Arraya said aloud that he could not have her. Reaves saw a figure in a red cape, hooded, gold chains around his neck marked with runes, a black staff in his hand with two cobras wound around it. Then the figure faded. The lights steadied. The flies were gone.`,
        `And that was the end of the ghostbusting. The reporter went home.`,
        `Here is what happened to the story, afterward. The paper dug up the facts it could. The house was built, or fixed up, in 1942. A neighbor remembered the first owner as a jovial man who liked opera, and sang it, badly. A later owner died in Red Bluff. About 1979 a man named Joe Nickels bought the house and rented it out, and said no one wanted to stay long: "There were some strange ones in there." Neighbors remembered a tenant who went crazy there, and the man right before Sisco, who never left the upstairs room and hollered all night. Nickels thought he had blown his mind on drugs.`,
        `And the tree. The reporter checked the tree. The first ten inches were black walnut. The rest was English walnut, grafted on top. The trunk was eight inches across. It could not have been standing in the 1950s, when the psychics thought the man had lived. The board had only spelled *staf*. The rest, the paper noted, was supplied by the psychics.`,
        `Farmer, to his credit, said evidence like this is always open to question. He also said, "Ninety percent of all ghosts are harmless." He thought it was a genuine haunting. Sisco was not so sure it was over. Doors still opened and closed, he said. Once, a window on the second floor slammed itself shut so hard he thought it had cracked the glass. His new wife, Elizabeth, saw a light in a bedroom flicker at her, almost angrily. They had a baby boy named Dustin. And Sisco feared for him.`,
        `Before the story even ran, the Siscos had moved out.`,
        `"Finally," the reporter wrote, "the house won."`,
        `The property was for sale. The article ended with a question: "Any offers?"`,
      ].join("\n\n"),
      sources: [
        otr1988("p. 10", "927856064"),
        otr1988("p. 24", "927856147"),
        er1986("Introduces Michael Farmer, 27, as founder and president of the Northern California Paranormal Research Society, who called the area a \"paranormal hotbed.\""),
      ],
    },
  ] satisfies SeedStop[],
};

/** Route stop keys, in walking order. */
/** `drawn` routes also get the walking line and directions from chico-ghost-route-data.ts. `pathKeys` lists the stops that drawn line actually covers (default: all of `keys`); a stop beyond it gets a straight line. */
export const chicoGhostRoutes: { name: string; description: string; keys: string[]; drawn?: boolean; line?: "full" | "driveWalk"; pathKeys?: string[] }[] = [
  { name: "Full tour", description: "All thirteen stops, ending with a long ride out East Avenue to the north Chico haunted house", keys: ["diamond", "rocks", "silberstein", "senator", "stoble", "stansbury", "bear", "elrey", "blueroom", "laxson", "bidwell", "goodman", "house"], drawn: true, pathKeys: ["diamond", "rocks", "silberstein", "senator", "stoble", "stansbury", "bear", "elrey", "blueroom", "laxson", "bidwell", "goodman"] },
  { name: "Walking tour (no haunted house)", description: "Twelve stops, finishing with a walk north along the Esplanade. Skips the north Chico house, which is miles out", keys: ["diamond", "rocks", "silberstein", "senator", "stoble", "stansbury", "bear", "elrey", "blueroom", "laxson", "bidwell", "goodman"], drawn: true },
  { name: "Downtown loop", description: "Only the downtown core, about an hour on foot", keys: ["diamond", "senator", "stoble", "silberstein", "rocks", "bear", "elrey", "blueroom"] },
  { name: "Best-sourced stops", description: "Stops with named witnesses, period newspapers or documented history", keys: ["rocks", "senator", "elrey", "blueroom", "bidwell", "goodman"] },
  { name: "Full Route Drive + Walk", description: "Drive in to the far spots, walk into downtown", keys: ["house", "goodman", "bidwell", "rocks", "silberstein", "stoble", "senator", "bear", "laxson", "blueroom", "diamond"], drawn: true, line: "driveWalk" },
];

/** Between-stops tidbits, exported from the live tour after hand edits in the editor. `near` is a stop key; `inPool` also adds a located fact to the tour-wide swipe-through. */
export const chicoGhostFacts: { text: string; near?: string; imageUrl?: string; lat?: number; lng?: number; radiusM?: number; inPool?: boolean }[] = [
  { text: "Chico used to have two Chinatowns, one on each side of downtown (Flume St and Cherry St). Similar to other California urban legends tunnels are said to have linked both Chinatowns beneath downtown businesses but no evidence of such tunnels has turned up.", near: "stoble", inPool: true },
  { text: "Echoing other tunnel myths, the late historian John Nopel said the lower levels of Broadway businesses between First and Second streets were connected, though a 2007 columnist doubted any network went beyond one block.", near: "stoble", inPool: true },
  { text: "On September 2, 1878, the New York Times ran a story titled \"Singular Phenomenon\" explaining a strange paranormal event in Chico: small fish, one to three inches long, fell from a cloudless sky onto a store roof and two or three acres around it, \"thick and fast.\" The writer first blamed pelicans, then \"weakened on the pelican theory.\" One man ate a fish and regretted not gathering more. Another preserved a good many in a bottle of gin.", near: "rocks", imageUrl: "/assets/singular-phenomenon-page.png", inPool: true },
  { text: "In 1922, Chico's Rock Throwing Ghost sent a letter signed \"the ghost,\" to some local men at a warehouse. Dated March 24, the Ghost said it was leaving town on business.", near: "rocks" },
  { text: "Chico's Rock Throwing Ghost story was dramatized on ABC's *One Step Beyond* on December 13, 1960.", near: "rocks", inPool: true },
  { text: "The Monthly Weather Review for March 1885 passes along a Chico Chronicle story: a meteor said to have struck about six miles east of town on the night of March 5-6, lighting the country for miles with a noise like thunder. A search party reportedly found a slate-colored, pyramid-shaped body over thirty feet long that shrugged off sledgehammer blows. A weather observer fifty miles away reported watching a meteor explode overhead that night, which the Review thought was probably the same one.", near: "silberstein", inPool: true },
  { text: "Chico reportedly required a permit to hold a séance, per a 1912 ordinance." },
  { text: "Annie Bidwell reportedly turned Madison Bear Garden, a former favorite drinking spot of John Bidwell's, into Prohibition Party headquarters.", near: "bear" },
  { text: "The El Rey's fairy murals were painted in 1948.", near: "elrey" },
  { text: "Chico State students and local legends say there have been 17 police reports of a chupacabra since 1978.", near: "laxson", inPool: true },
  { text: "Though a local legend said there were tunnels leading out of Bidwell Mansion towards a neighboring Native American village, in reality the closest thing to a secret passage was a closet joining two guest rooms.", near: "bidwell" },
  { text: "The Disney Channel's first official original movie, *Under Wraps* (1997), was filmed in Chico in the summer of 1996. The producer reportedly chose the town because almost nothing had been filmed here before. (The 2021 remake was not shot in Chico) " },
  { text: "City Plaza is the town square in *Under Wraps* (1997), back when it had giant elms. They were removed, though, when the plaza was rebuilt.", near: "rocks" },
  { text: "In December (likely 2018), a driver on Vallombrosa Avenue by Lower Bidwell Park told a paranormal blogger that a huge, dark, hair-covered creature crossed the road in three leaps, turned to look at them, and flashed golden eyeshine. A second, smaller one may have crouched down the road. \n\nA few years later, in October 2020, two people having a picnic by the creek in Upper Bidwell Park at dusk heard something heavy running through the trees. One said it was a large, gray-haired creature running upright, fast, about fifteen feet away, with a waist as high as their own 6'1\" height. They said they were \"not calling it Bigfoot,\" but had never seen anything like it.\n\nParanormal blogger, Lon Strickler, recorded each encounter in a post on his blog.", near: "goodman", lat: 39.731977, lng: -121.842005, radiusM: 100 },
  { text: "The shoe tree in Don Simic’s almond orchard off Hegan Lane slightly out of the main town in Southern Chico is a peculiar spectacle. After a walnut tree on the property died, Simic decided to hang shoes from its dead limbs. Passersby began leaving shoes at the base of the trunk, which he happily added to the collection. Dangling from the tree were athletic shoes, old-school saddle shoes, dress shoes, moon boots and even roller skates." },
];
