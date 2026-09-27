import rhyvoriArt from "../../candidates/duohertz/characters/rhyvori-concept.png?url";
import nivareoArt from "../../candidates/duohertz/characters/nivareo-concept.png?url";
import zorymelaArt from "../../candidates/duohertz/characters/zorymela-concept.png?url";
import rhyvoriSideArt from "../../candidates/duohertz/characters/rhyvori-side-concept.png?url";
import nivareoSideArt from "../../candidates/duohertz/characters/nivareo-side-concept.png?url";
import zorymelaSideArt from "../../candidates/duohertz/characters/zorymela-side-concept.png?url";

/** Review-only concepts, never the old BeatScape character catalog. */
export const DUOHERTZ_CHARACTER_CONCEPTS = [
  {
    name: "RHYVORI",
    title: "The First Pulse",
    role: "Attacker",
    region: "Pulse Dock",
    height: "165 cm",
    identity: "Turns the first tap into a low pulse anyone can follow.",
    traits: "Curious · decisive · warm · sometimes rushes the beat",
    quote: "Start with one beat. We can build the rest together.",
    story: "At Pulse Dock, RHYVORI grew up among speakers that could turn the smallest tap into a ring of light. They loved racing the loudest beats across the floor, but their fast patterns left new players watching from the edge. One evening, a child reached for the stage and pulled back because there seemed to be no place to join. RHYVORI stopped the music and played a single, steady pulse. The child tapped back. Soon the whole dock answered, one person at a time, until their simple rhythm filled the room. RHYVORI now opens every gathering with a beat anyone can find. When players choose one key, RHYVORI shows where that beat lives; when they are ready for two, RHYVORI leaves a space for their answer. Their gift is not speed. It is the courage to begin and the joy of making the first note easy to share.",
    art: rhyvoriArt,
    alt: "RHYVORI in a coral jacket opens a hand with a cyan pulse ring",
    sideArt: rhyvoriSideArt,
    sideAlt: "Side view of RHYVORI in a coral jacket with a cyan wrist pulse tuner",
  },
  {
    name: "NIVAREO",
    title: "The Reply Wave",
    role: "Support",
    region: "Echo Commons",
    height: "169 cm",
    identity: "Hears another person's beat and answers with a welcoming wave.",
    traits: "Patient · attentive · playful · steadfast",
    quote: "I heard your rhythm. Try mine beside it.",
    story: "In Echo Commons, every sound returns a little differently. NIVAREO learned to listen there by collecting tiny echoes in glass tuning rings. A visitor once told them that their own beat was too quiet to matter. Instead of asking for a louder performance, NIVAREO played the visitor's rhythm back with one gentle note beside it. The two sounds made a new pattern, and the visitor tried again. Now NIVAREO helps players hear their place in a song without telling them how they must play. In a two-key passage, one note can ask a question and the other can answer; in Duo, each player keeps their own voice while sharing the same measure. NIVAREO smiles when a mistake becomes a new attempt, because an echo is an invitation, not a verdict. They keep an empty tuning ring for every player who has yet to discover their own reply.",
    art: nivareoArt,
    alt: "NIVAREO in lavender streetwear listens to a small violet echo ring",
    sideArt: nivareoSideArt,
    sideAlt: "Side view of NIVAREO in lavender streetwear holding a violet echo ring",
  },
  {
    name: "ZORYMELA",
    title: "Weaver of Waves",
    role: "Buffer",
    region: "Prism Yard",
    height: "172 cm",
    identity: "Weaves two rhythms into visible waves without hiding either voice.",
    traits: "Calm · precise · inventive · considerate",
    quote: "Two notes can leave room for every voice.",
    story: "ZORYMELA works in Prism Yard, where colored waves cross above the rooftops at different speeds. As a child, they tried to force every wave into one perfect line. The result looked neat but sounded thin. Later, two friends played very different rhythms nearby: one marked a slow pulse while the other added quick, bright notes. ZORYMELA watched the waves meet without erasing each other and built a small prism that made both patterns visible. That discovery changed how they design the yard's light shows. ZORYMELA gives each sound room to travel, then guides the moment when two sounds meet. In a two-key song, their ripples show the left and right beats clearly; in Duo, each player can see a separate trail and the shared shape between them. ZORYMELA believes harmony does not require everyone to sound alike. It begins when people can hear themselves and one another at the same time.",
    art: zorymelaArt,
    alt: "ZORYMELA holds a clear prism where cyan and lavender sound waves meet",
    sideArt: zorymelaSideArt,
    sideAlt: "Side view of ZORYMELA holding a prism between cyan and lavender waves",
  },
] as const;
