/* African Bitcoin Ecosystem Growth Tracker: master dataset
   Source: "African Bitcoin Ecosystem Growth Tracker" ledger (Q3 2024 to Q4 2026).
   basis: VERIFIED = taken from a published post or newsletter
          COUNTED  = counted name by name from the infographic
          BLANK    = no figure recovered for that quarter
   null means "not recorded". It never means zero. */

window.ABE = {
  updated: "October 2026",

  /* Every reporting point since the first infographic */
  history: [
    { q: "Q3 2024", total: 118, countries: 18, added: 17, removed: null, rate: 16, rateNote: "Stated in the newsletter", basis: "VERIFIED",
      note: "3 non-Bitcoin-only firms removed. Tanzania and Malawi added." },
    { q: "Q4 2024", total: 122, countries: 19, added: null, removed: null, rate: null, basis: "VERIFIED",
      note: "From the post of Oct 1, 2024." },
    { q: "Q1 2025", total: 144, countries: 21, added: 17, removed: null, rate: null, basis: "VERIFIED",
      note: "Burundi and Botswana added. Up 77% year on year (an annual figure, not a quarterly rate)." },
    { q: "Q2 2025", total: null, countries: null, added: null, removed: null, rate: null, basis: "BLANK",
      note: "No figures recovered for this quarter." },
    { q: "Q3 2025", total: null, countries: null, added: 15, removed: null, rate: null, basis: "VERIFIED",
      note: "New-project count verified. Madagascar added. Total not recorded." },
    { q: "Q4 2025", total: 159, countries: 22, added: 20, removed: null, rate: null, basis: "VERIFIED",
      note: "Mozambique and Burkina Faso added. Up 30% over one year (an annual figure)." },
    { q: "Q1 2026", total: 165, countries: 24, added: null, removed: null, net: 6, rate: 3.8, rateNote: "Mixed basis", basis: "COUNTED",
      note: "Counted from the infographic. New and removed not available: the Q4 2025 image was not supplied." },
    { q: "Q2 2026", total: 176, countries: 25, added: 11, removed: 0, net: 11, rate: 6.7, basis: "COUNTED",
      note: "Compared name by name with Q1. Mauritius added." },
    { q: "Q3 2026", total: 188, countries: 25, added: 14, removed: 2, net: 12, rate: 6.8, basis: "COUNTED",
      note: "Posted figures were 189 listings, 23 countries and 13 new. Counted figures shown." },
    { q: "Q4 2026", total: 180, countries: 25, added: 3, removed: 12, net: -8, rate: -4.8, basis: "COUNTED",
      note: "3 new, 12 removed, plus 1 repeated listing (Bitcoin In The Wild). Baseline for future tracking." }
  ],

  /* Quarters with full name-by-name data. Index 0..3 */
  quarters: ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"],

  /* Listings by country, Q1..Q4 2026. id = ISO 3166-1 numeric (matches world-atlas) */
  countries: [
    { name: "Nigeria",       code: "NG", id: "566", region: "West",     v: [28, 28, 31, 29] },
    { name: "South Africa",  code: "ZA", id: "710", region: "Southern", v: [29, 29, 29, 25] },
    { name: "Kenya",         code: "KE", id: "404", region: "East",     v: [20, 20, 19, 19] },
    { name: "Zambia",        code: "ZM", id: "894", region: "East",     v: [8, 10, 10, 9] },
    { name: "Ghana",         code: "GH", id: "288", region: "West",     v: [6, 6, 7, 7] },
    { name: "Uganda",        code: "UG", id: "800", region: "East",     v: [6, 8, 8, 6] },
    { name: "Benin",         code: "BJ", id: "204", region: "West",     v: [4, 4, 5, 5] },
    { name: "Ethiopia",      code: "ET", id: "231", region: "East",     v: [4, 4, 4, 4] },
    { name: "Malawi",        code: "MW", id: "454", region: "East",     v: [2, 3, 4, 4] },
    { name: "Burundi",       code: "BI", id: "108", region: "East",     v: [3, 3, 4, 4] },
    { name: "Tanzania",      code: "TZ", id: "834", region: "East",     v: [2, 3, 3, 3] },
    { name: "Mozambique",    code: "MZ", id: "508", region: "East",     v: [2, 3, 3, 3] },
    { name: "Senegal",       code: "SN", id: "686", region: "West",     v: [3, 3, 3, 3] },
    { name: "Togo",          code: "TG", id: "768", region: "West",     v: [3, 3, 3, 3] },
    { name: "Zimbabwe",      code: "ZW", id: "716", region: "East",     v: [3, 3, 3, 3] },
    { name: "Namibia",       code: "NA", id: "516", region: "Southern", v: [3, 3, 3, 2] },
    { name: "Cameroon",      code: "CM", id: "120", region: "Central",  v: [1, 1, 2, 2] },
    { name: "DR Congo",      code: "CD", id: "180", region: "Central",  v: [2, 2, 2, 2] },
    { name: "Côte d'Ivoire", code: "CI", id: "384", region: "West",     v: [2, 2, 2, 2] },
    { name: "Eritrea",       code: "ER", id: "232", region: "East",     v: [1, 2, 2, 2] },
    { name: "Mauritius",     code: "MU", id: "480", region: "East",     v: [0, 1, 2, 2] },
    { name: "Sudan",         code: "SD", id: "729", region: "North",    v: [1, 1, 1, 1] },
    { name: "Burkina Faso",  code: "BF", id: "854", region: "West",     v: [1, 1, 1, 1] },
    { name: "Madagascar",    code: "MG", id: "450", region: "East",     v: [1, 1, 1, 1] },
    { name: "Botswana",      code: "BW", id: "072", region: "Southern", v: [1, 1, 1, 1] }
  ],

  /* Pan-African projects. Not a country, so never drawn on the map */
  africaWide: [29, 31, 35, 37],

  /* UN geoscheme sub-regions */
  regions: [
    { key: "East",     name: "East Africa" },
    { key: "West",     name: "West Africa" },
    { key: "Southern", name: "Southern Africa" },
    { key: "Central",  name: "Central Africa" },
    { key: "North",    name: "North Africa" }
  ],

  /* Category counts Q1..Q4 2026. Q3 categories add up to the posted 189. */
  categories: [
    { key: "education",  name: "Education",            v: [40, 44, 48, 46], top: ["Nigeria (6)", "Nigeria (6)", "Nigeria (7)", "Nigeria (7)"], lead: [["NG"], ["NG"], ["NG"], ["NG"]] },
    { key: "community",  name: "Community & Meetups",  v: [32, 34, 38, 37], top: ["South Africa (7)", "South Africa (7)", "South Africa (7)", "South Africa (7)"], lead: [["ZA"], ["ZA"], ["ZA"], ["ZA"]] },
    { key: "circular",   name: "Circular Economy",     v: [27, 28, 24, 20], top: ["South Africa (11)", "South Africa (11)", "South Africa (8)", "South Africa (8)"], lead: [["ZA"], ["ZA"], ["ZA"], ["ZA"]] },
    { key: "business",   name: "Business & Retail",    v: [16, 16, 19, 19], top: ["Uganda (4)", "Uganda (4)", "Uganda (4)", "Uganda (4)"], lead: [["UG"], ["UG"], ["UG"], ["UG"]] },
    { key: "hodl",       name: "HODL",                 v: [14, 15, 18, 17], top: ["Nigeria (4)", "Nigeria (4)", "Nigeria (5)", "Nigeria (5)"], lead: [["NG"], ["NG"], ["NG"], ["NG"]] },
    { key: "tech",       name: "Tech Meetups",         v: [11, 13, 16, 16], top: ["Nigeria (4)", "Nigeria (4)", "Nigeria (5)", "Nigeria (5)"], lead: [["NG"], ["NG"], ["NG"], ["NG"]] },
    { key: "funding",    name: "Funding & Non-profit", v: [10, 10, 10, 10], top: ["South Africa (3)", "South Africa (3)", "South Africa & Nigeria (2 each)", "South Africa & Nigeria (2 each)"], lead: [["ZA"], ["ZA"], ["ZA", "NG"], ["ZA", "NG"]] },
    { key: "media",      name: "Media",                v: [8, 9, 9, 8],     top: ["4-way tie (1 each)", "4-way tie (1 each)", "4-way tie (1 each)", "4-way tie (1 each)"], lead: [["NG", "KE", "ZM", "CI"], ["NG", "KE", "ZM", "CI"], ["NG", "KE", "ZM", "CI"], ["NG", "KE", "ZM", "CI"]] },
    { key: "mining",     name: "Mining",               v: [7, 7, 7, 7],     top: ["Ethiopia & Nigeria (2 each)", "Ethiopia & Nigeria (2 each)", "Ethiopia & Nigeria (2 each)", "Ethiopia & Nigeria (2 each)"], lead: [["ET", "NG"], ["ET", "NG"], ["ET", "NG"], ["ET", "NG"]] }
  ],

  /* Projects that joined. q = index of the first quarter they appeared in */
  joined: [
    { name: "Pan-African Bitcoin",      country: "Eritrea",       cat: null,                  date: "Jul 6, 2026",  source: "Infographic comparison", q: 1, note: "Re-entry" },
    { name: "Bitdevs Mauritius",        country: "Mauritius",     cat: "Tech Meetup",         date: "Mar 18, 2026", source: "Directory submission",   q: 1, note: "New country" },
    { name: "Bitcoin High School",      country: "Uganda",        cat: "Education",           date: "Mar 5, 2026",  source: "Directory submission",   q: 1 },
    { name: "Bitdevs Kampala",          country: "Uganda",        cat: "Tech Meetup",         date: "Mar 23, 2026", source: "Directory submission",   q: 1 },
    { name: "Bitcoin SafariTz",         country: "Tanzania",      cat: null,                  date: null,           source: "Infographic comparison", q: 1 },
    { name: "Lwandi Bitcoin",           country: "Mozambique",    cat: "Circular Economy",    date: "Mar 11, 2026", source: "Directory submission",   q: 1 },
    { name: "Open Study Hubs",          country: "Malawi",        cat: "Education",           date: "Mar 5, 2026",  source: "Directory submission",   q: 1 },
    { name: "Bitzed",                   country: "Zambia",        cat: "Exchange",            date: "Mar 4, 2026",  source: "Directory submission",   q: 1 },
    { name: "BitJr Academy & Space",    country: "Zambia",        cat: "Community",           date: "Mar 24, 2026", source: "Directory submission",   q: 1 },
    { name: "Africa Bitcoin News",      country: "Africa Wide",   cat: "Media",               date: "Mar 20, 2026", source: "Directory submission",   q: 1 },
    { name: "African Bitcoiners",       country: "Africa Wide",   cat: "Community",           date: "Mar 20, 2026", source: "Directory submission",   q: 1 },
    { name: "Zazapay Lightning",        country: "Ghana",         cat: "Finance",             date: "Feb 19, 2026", source: "Directory submission",   q: 2 },
    { name: "Breezee",                  country: "Benin",         cat: "Business",            date: "Jan 8, 2026",  source: "Directory submission",   q: 2 },
    { name: "Grim App",                 country: "Cameroon",      cat: "Wallet",              date: "Apr 19, 2026", source: "Directory submission",   q: 2 },
    { name: "Bityara",                  country: "Nigeria",       cat: "Education",           date: "Jun 11, 2026", source: "Directory submission",   q: 2 },
    { name: "BitDevs Ilorin",           country: "Nigeria",       cat: "Developer Community", date: "Jan 19, 2026", source: "Directory submission",   q: 2 },
    { name: "Sabi Wallet",              country: "Nigeria",       cat: "Wallet",              date: "Jan 17, 2026", source: "Directory submission",   q: 2 },
    { name: "OS Guild",                 country: "Mauritius",     cat: "Developer Community", date: "Jun 23, 2026", source: "Directory submission",   q: 2 },
    { name: "Rurbit",                   country: "Burundi",       cat: "HODL",                date: "Apr 28, 2026", source: "Directory submission",   q: 2 },
    { name: "BitDevs Malawi",           country: "Malawi",        cat: "Developer Community", date: "Apr 14, 2026", source: "Directory submission",   q: 2 },
    { name: "BitmernSolo",              country: "South Africa",  cat: "Business",            date: "May 14, 2026", source: "Directory submission",   q: 2 },
    { name: "Africa Bitcoin Corporation", country: "Africa Wide", cat: null,                  date: "Jul 6, 2026",  source: "Directory import",       q: 2, note: "Re-entry" },
    { name: "Bitcoin Students Network", country: "Africa Wide",   cat: "Community",           date: "May 7, 2026",  source: "Directory submission",   q: 2 },
    { name: "HakiFedha",                country: "Africa Wide",   cat: "Education",           date: "Jun 15, 2026", source: "Directory submission",   q: 2 },
    { name: "Satoshi Sister Circle",    country: "Africa Wide",   cat: "Community",           date: "Feb 17, 2026", source: "Directory submission",   q: 2 },
    { name: "BitSave",                  country: "Nigeria",       cat: "Finance",             date: "Jul 25, 2026", source: "Directory submission",   q: 3 },
    { name: "Satolink",                 country: "Africa Wide",   cat: "Finance",             date: "Jul 8, 2026",  source: "Directory submission",   q: 3 },
    { name: "Hodlstay",                 country: "Africa Wide",   cat: null,                  date: null,           source: "Infographic comparison", q: 3 }
  ],

  /* Projects that left. q = index of the first quarter they were missing from */
  removed: [
    { name: "MulaStack",                 country: "Kenya",        q: 2 },
    { name: "Altvest Capital",           country: "South Africa", q: 2 },
    { name: "Bitcoin Frenzy",            country: "Uganda",       q: 3 },
    { name: "Meta Coffee",               country: "Uganda",       q: 3 },
    { name: "Bitcoin Studio",            country: "Namibia",      q: 3 },
    { name: "Luminous",                  country: "Nigeria",      q: 3 },
    { name: "Bitcoin in Nigeria Media",  country: "Nigeria",      q: 3 },
    { name: "WeDoBitcoin",               country: "South Africa", q: 3 },
    { name: "Bitcoin Johannesburg",      country: "South Africa", q: 3 },
    { name: "Bitcoin El Zera",           country: "South Africa", q: 3 },
    { name: "BTC Elephant Fund",         country: "South Africa", q: 3 },
    { name: "Bitshack",                  country: "South Africa", q: 3 },
    { name: "Bitcoin for HER",           country: "Zambia",       q: 3 },
    { name: "AirBTC",                    country: "Africa Wide",  q: 3 }
  ],

  /* Renames and moves: counted once, not as add + remove */
  moves: [
    { name: "Blocc", change: "Listed as OnTheBlocc (Africa Wide) in Q4", treatment: "Rename. Counted once.", q: 3 },
    { name: "Bitcoin Africa Story", change: "Moved from Nigeria to Africa Wide in Q4", treatment: "Nigeria falls by 1, Africa Wide rises by 1.", q: 3 }
  ],

  /* Hand-written spotlights. Every claim comes from the ledger. */
  spotlights: {
    NG: "Africa's largest Bitcoin ecosystem by listings, and the outright leader in HODL, Education and Tech Meetups.",
    ZA: "Leads Community and Circular Economy, but took the biggest Q4 hit: 5 of the quarter's 12 removals were South African.",
    KE: "The third-largest ecosystem. Steady at 19 since MulaStack left in Q3.",
    ZM: "Grew from 8 to 10 in Q2 as Bitzed and BitJr Academy & Space joined.",
    UG: "Africa's leader in Business & Retail. Grew to 8 in Q2, then lost Bitcoin Frenzy and Meta Coffee in Q4.",
    GH: "Zazapay Lightning joined in Q3, taking Ghana to 7.",
    BJ: "Breezee joined in Q3, taking Benin from 4 to 5.",
    ET: "Shares the lead in Mining with Nigeria, 2 projects each.",
    MW: "Doubled in 2026, from 2 to 4, with Open Study Hubs and BitDevs Malawi.",
    BI: "Rurbit, a HODL project, joined in Q3.",
    MU: "The newest country on the map: Bitdevs Mauritius arrived in Q2 and OS Guild in Q3.",
    CM: "Doubled in Q3 when the Grim App wallet joined.",
    ER: "Pan-African Bitcoin was listed here from Q2, taking Eritrea to 2.",
    NA: "Bitcoin Studio left in Q4, taking Namibia from 3 to 2.",
    SD: "The only listing in all of North Africa."
  }
};
