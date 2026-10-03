// Chico Ghost Tour, from the research handoff. Copy is deliberately hedged: stops without a primary
// source are framed as local legend, and each source description carries its verification status.
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

const cnr = (note: string) => ({ title: "Haunts and hoaxes (Chico News & Review, Aug 28, 2008)", url: CNR, description: `Secondary source, on record. ${note}` });
const orion = (note: string) => ({ title: "Echoes of spirits: Chico Haunted Tours (The Orion, Oct 5, 2025)", url: ORION, description: `Secondary source. ${note}` });
const ann = (note: string) => ({ title: "Haunted Chico tour blends history and the supernatural (ActionNewsNow, Oct 23, 2025)", url: ANN, description: `Secondary source. ${note}` });

export const chicoGhostTour = {
  slug: "chico-ghost-tour",
  title: "Chico Ghost Tour",
  city: "Chico, CA",
  lat: 39.7285,
  lng: -121.8405,
  theme: "ghost",
  status: "draft" as const,
  tags: ["Ghost stories", "Walkable", "Local history"],
  summary: "A walk through downtown Chico's haunted hotels, theaters and bars, and the rock-throwing ghost that made national news in 1922.",
  story:
    "Downtown Chico was laid out by John Bidwell, and plenty of what happened here is still told as local legend. " +
    "Each stop shows how well we could source its story: a documented event, a named witness on the record, or a tale passed down by tour guides. " +
    "Where we found no record, the story is told as legend. " +
    "A recurring local motif: guide Dustin Vaught says there have been 17 police reports of chupacabra sightings downtown since 1978 (unverified; no records request has been made).",
  stops: [
    {
      key: "diamond",
      title: "Hotel Diamond",
      lat: 39.72828, lng: -121.84035,
      story:
        "Built in 1904 by James Franklin Morehead, the Hotel Diamond is the first stop on most Chico ghost walks.\n\n" +
        "Local legend says a traveling salesman took his own life on the third floor. Guests report a knock at the door and a man in a suit trying to sell them things. " +
        "A separate woman in white is said to appear in the building's stained-glass windows and in the neighboring parking garage. " +
        "Ghost hunters reportedly recorded a voice saying \"evil spirit, stay away, the tree.\"\n\n" +
        "Legend, not record: we found no newspaper or coroner's record of the salesman's death.",
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
      story:
        "Workers renovating this Broadway building reported hammers and tools falling off the scaffolding on their own, and some said they saw a man in a brown suit.\n\n" +
        "This is a tour-guide account, repeated in local news but with no named witnesses.",
      sources: [ann("Only source; no named witnesses.")],
    },
    {
      key: "silberstein",
      title: "Silberstein Building",
      lat: 39.7289, lng: -121.8385, radiusM: 60, // APPROX: did not geocode
      story:
        "After the Civil War, spiritualism swept the country, and this building is said to have hosted regular séances.\n\n" +
        "Chico reportedly passed an ordinance in 1912 requiring a permit to hold one. That claim comes from the tour itself and hasn't been checked against city records, so take it as a good story, not settled fact.",
      sources: [orion("Source for the séances and the 1912 permit ordinance. The ordinance text is unverified.")],
    },
    {
      key: "rocks",
      title: "The Rock-Throwing Ghost (City Plaza)",
      lat: 39.72831, lng: -121.83888, radiusM: 80,
      story:
        "The best-documented legend in town. Starting in late 1921, rocks began falling on a downtown Chico warehouse owned by J.H. Priel and a partner named Charge. " +
        "In March 1922 they pelted Main Street. A letter signed \"the ghost\" told the men it was leaving town on business. The story made national headlines.\n\n" +
        "Nobody was caught. About sixty years later, the story goes, the last surviving prankster confessed on his deathbed.\n\n" +
        "Period names to look for in the Chico Record: City Marshal J.A. Peck (took the first complaint), Fire Chief C.E. Tovee and Traffic Officer J.J. Corbett (investigated). " +
        "Sources spell the partner's name \"Clarence Charge\" and \"J.W. Charge\"; that is unresolved.\n\n" +
        "Also on record from Chico: in 1878 fish reportedly fell from the sky, per a Chico Record account picked up by the New York Times.",
      sources: [
        { title: "\"The Rock-Throwing Ghost of Chico\" by Hector Lee (Calisphere)", url: "https://calisphere.org/item/84cd25fb2abe436746a475b8a97c3f5e/", kind: "audio", description: "Primary source, confirmed. Episode 14 of Tales of the Redwood Empire (KSRO radio, aired Dec 17, likely 1962), held at Meriam Library Special Collections." },
        { title: "Hector Lee radio episode (Internet Archive)", url: "https://archive.org/details/cchis_000061", kind: "audio", description: "Primary source, confirmed. Same recording on archive.org." },
        { title: "Hector Haight Lee papers, 1945-1988 (Archives West)", url: "https://archiveswest.orbiscascade.org/ark:80444/xv99011", kind: "document", description: "Finding aid. Likely holds the typescript of this episode; not yet checked." },
        { title: "California Digital Newspaper Collection: Chico Record 1906-1948", url: "https://cdnc.ucr.edu/?a=cl&cl=CL1&sp=CR", description: "Unverified. Free, searchable; try \"ghost\", \"rocks\", \"Charge\" for Nov 1921 to Mar 1922." },
        { title: "Chico Record, Jan 27, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19220127.2.13", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Jul 6, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19220706.2.63", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Aug 8, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19220808.2.75.3", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Dec 2, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19221202.2.14", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Dec 6, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19221206.2.6", description: "Unverified: indexed issue page, content not yet read." },
        { title: "Chico Record, Dec 30, 1922 (CDNC)", url: "https://cdnc.ucr.edu/?a=d&d=CR19221230.2.15", description: "Unverified: indexed issue page, content not yet read." },
        cnr("Quotes John Gallardo, president of Chico's Heritage Association, on the deathbed confession."),
      ],
    },
    {
      key: "bear",
      title: "Madison Bear Garden",
      lat: 39.72912, lng: -121.84256,
      story:
        "Known as \"The Bear.\" The building was once the home of Franklin Lusk, John Bidwell's lawyer, where Bidwell supposedly drank late against his wife Annie's wishes. " +
        "After John died, Annie made it the headquarters of the Prohibition Party.\n\n" +
        "Bartenders report a hand on the shoulder. A second ghost, a little girl said to have died in a carriage accident on Salem Street, is blamed for a child's laughter heard by a chef, and a coworker once followed a girl into an empty bathroom.\n\n" +
        "Look for the Masonic pentagram on the building, a nod to the Freemason-influenced geometry of Bidwell's downtown street plan.",
      sources: [
        orion("Source for the Lusk house story, the bartender and the little girl. No property record found yet."),
      ],
    },
    {
      key: "elrey",
      title: "El Rey Theatre",
      lat: 39.72955, lng: -121.84208,
      story:
        "No documented haunting here, but a real, dramatic history. The theater opened in 1906 as the Majestic, built by the Chico Elks Lodge. " +
        "It became the National (1924), the American (1939), and the El Rey when it reopened in 1948.\n\n" +
        "The reopening followed an arsonist's fire on October 24, 1946, that gutted the interior. The arsonist was caught a week later. " +
        "Tour materials call it a \"frightful story of its own\"; that story is the fire.",
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
      story:
        "The theater stands where a Masonic Temple stood for more than a century. No one is sure whether the ghost is a former worshipper, an actor, or an audience member.\n\n" +
        "Former technical director Jeremy Votava told the Chico News & Review he heard footsteps on the stairs while working alone at night. He checked, found no one, and the door was locked.",
      sources: [
        cnr("Named, on-record quote from Jeremy Votava."),
      ],
    },
    {
      key: "laxson",
      title: "Laxson Auditorium (Chico State)",
      lat: 39.72992, lng: -121.8437,
      story:
        "Performers have reported the apparition of an elderly woman sitting in a balcony seat.\n\n" +
        "The story appears in a student-paper roundup of campus myths; no individual witness is named.",
      sources: [
        { title: "Rumor Has It: 10 Chico State Myths Explored (Chico State Today, Nov 13, 2021)", url: "https://today.csuchico.edu/rumor-has-it-10-chico-state-myths-explored/", description: "Secondary source." },
      ],
    },
    {
      key: "stansbury",
      title: "Stansbury Home",
      lat: 39.72667, lng: -121.83987,
      story:
        "Built in 1883 by Dr. Oscar Stansbury and listed on the National Register of Historic Places in 1974. People say it's haunted, but as of 2008 reporting nobody could point to a specific encounter.\n\n" +
        "Come for the Victorian architecture; the ghost, if any, keeps quiet.",
      sources: [
        { title: "Stansbury Home (City of Chico)", url: "https://chicoca.gov/__catapult_pages/0e95208f-5002-47e7-b49f-c6e36e731f3b/Stansbury-Home.html", description: "Building history." },
        cnr("Notes the rumor but no specific encounter."),
      ],
    },
    {
      key: "bidwell",
      title: "Bidwell Mansion",
      lat: 39.73236, lng: -121.84356,
      story:
        "The home of John and Annie Bidwell, founders of Chico. The mansion is rumored to be haunted, but as of 2008 reporting no one could point to a specific encounter.\n\n" +
        "What it does have is history: this is where Bidwell's vision for the town, down to the street plan you've been walking, began.",
      sources: [cnr("Notes the rumor but no specific encounter.")],
    },
    {
      key: "goodman",
      title: "Goodman House Bed & Breakfast",
      lat: 39.74095, lng: -121.84737, radiusM: 60,
      story:
        "Said to be haunted by George Vogelsang, who lived here for about fifty years and died in 1958 at age 90 after a fall down the stairs.\n\n" +
        "In the 1970s, when the building held law offices, doors and files reportedly wouldn't open. In 2003 a painter working alone in the basement repeatedly heard footsteps upstairs. " +
        "Owner Margo Graham spoke to the Chico News & Review on the record.\n\n" +
        "This stop is a longer walk north of downtown along the Esplanade. Vogelsang's 1958 death record has not been pulled.",
      sources: [cnr("On-record quotes from owner Margo Graham.")],
    },
  ] satisfies SeedStop[],
};

/** Route stop keys, in walking order. */
export const chicoGhostRoutes = [
  { name: "Full tour", description: "All eleven stops, finishing with a walk north along the Esplanade", keys: ["diamond", "stoble", "silberstein", "rocks", "bear", "elrey", "blueroom", "laxson", "stansbury", "bidwell", "goodman"] },
  { name: "Downtown loop", description: "Only the downtown core, about an hour on foot", keys: ["diamond", "stoble", "silberstein", "rocks", "bear", "elrey", "blueroom"] },
  { name: "Best-sourced stops", description: "Stops with named witnesses or documented history", keys: ["rocks", "elrey", "blueroom", "goodman"] },
];
