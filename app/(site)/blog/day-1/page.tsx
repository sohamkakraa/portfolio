import type { Metadata } from "next";
import Image from "next/image";
import { Source_Serif_4 } from "next/font/google";
import DayOneProgress from "./DayOneProgress";
import PhotoMetadata, { type CameraSettings } from "./PhotoMetadata";
import "./day-one.css";

const sourceSerif = Source_Serif_4({ variable: "--font-day-source-serif", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "There Has to Be a DAY 1: A Solo Trip Through Costa Brava",
  description: "A raw solo travel essay about a 30-hour bus to Barcelona, Montserrat, learning to scuba dive in L'Estartit, and outrunning a lightning storm on Costa Brava.",
  authors: [{ name: "Soham Kakra", url: "https://sohamkakra.com/about" }],
  creator: "Soham Kakra",
  alternates: { canonical: "/blog/day-1" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "There Has to Be a DAY 1: A Solo Trip Through Costa Brava",
    description: "Thirty hours on a bus, Barcelona, Montserrat, scuba diving, a hidden cove, and a lightning storm. A raw essay about doing things while scared.",
    type: "article",
    url: "https://sohamkakra.com/blog/day-1",
    siteName: "Soham Kakra",
    locale: "en_GB",
    publishedTime: "2026-09-13T12:00:00+02:00",
    modifiedTime: "2026-09-13T12:00:00+02:00",
    authors: ["https://sohamkakra.com/about"],
    tags: ["Solo travel", "Costa Brava", "Barcelona", "Scuba diving", "Personal essay"],
    images: [{
      url: "/blog/day-1/cliffs.webp",
      width: 2400,
      height: 1600,
      alt: "A dark rocky cove opening into the Mediterranean near Torroella de Montgrí",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "There Has to Be a DAY 1: A Solo Trip Through Costa Brava",
    description: "A raw essay about travelling alone, learning to dive, and doing things while scared.",
    images: ["/blog/day-1/cliffs.webp"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: "There Has to Be a DAY 1",
  description: "A raw solo travel essay about Barcelona, Montserrat, scuba diving in L'Estartit, Costa Brava, fear, and starting anyway.",
  image: {
    "@type": "ImageObject",
    url: "https://sohamkakra.com/blog/day-1/cliffs.webp",
    width: 2400,
    height: 1600,
  },
  datePublished: "2026-09-13T12:00:00+02:00",
  dateModified: "2026-09-13T12:00:00+02:00",
  inLanguage: "en",
  mainEntityOfPage: "https://sohamkakra.com/blog/day-1",
  author: {
    "@type": "Person",
    name: "Soham Kakra",
    url: "https://sohamkakra.com/about",
  },
  publisher: {
    "@type": "Person",
    name: "Soham Kakra",
    url: "https://sohamkakra.com",
  },
  about: ["Solo travel", "Costa Brava", "Barcelona", "Montserrat", "Scuba diving", "Fear"],
};

const settings = {
  cove: { aperture: "f/16", shutter: "20s", iso: "50", focalLength: "28mm" },
  luxembourg: { aperture: "f/22", shutter: "6s", iso: "50", focalLength: "36mm" },
  barcelona: { aperture: "f/4", shutter: "1/2000s", iso: "100", focalLength: "33mm" },
  montserrat: { aperture: "f/7.1", shutter: "1/400s", iso: "100", focalLength: "70mm" },
  harbour: { aperture: "f/4.5", shutter: "1/640s", iso: "100", focalLength: "49mm" },
  underwater: { aperture: "f/4.5", shutter: "1/100s", iso: "100", focalLength: "46mm" },
  medes: { aperture: "f/4.5", shutter: "1/320s", iso: "100", focalLength: "44mm" },
  trail: { aperture: "f/4", shutter: "1/320s", iso: "100", focalLength: "34mm" },
  cliffs: { aperture: "f/4", shutter: "1/200s", iso: "100", focalLength: "28mm" },
  edge: { aperture: "f/4.5", shutter: "1/200s", iso: "100", focalLength: "44mm" },
  sea: { aperture: "f/36", shutter: "4s", iso: "50", focalLength: "70mm" },
} satisfies Record<string, CameraSettings>;

const Photo = ({ src, alt, caption, settings: cameraSettings, note, portrait = false }: { src: string; alt: string; caption: string; settings: CameraSettings; note?: string; portrait?: boolean }) => (
  <figure className={`day-photo${portrait ? " portrait" : ""}`}>
    <div className="day-photo-frame" data-parallax>
      <Image src={src} alt={alt} width={portrait ? 1600 : 2400} height={portrait ? 2400 : 1600} sizes={portrait ? "(max-width: 720px) 90vw, 680px" : "(max-width: 720px) 95vw, 1240px"} />
      <PhotoMetadata settings={cameraSettings} />
    </div>
    <figcaption className="day-photo-caption">{caption}<span>{note ?? "September 2026"}</span></figcaption>
  </figure>
);

const Reference = ({ href, label, title }: { href: string; label: string; title: string }) => (
  <a className="day-reference" href={href} target="_blank" rel="noreferrer">
    <span><small>{label}</small><strong>{title}</strong></span><span aria-hidden>↗</span>
  </a>
);

export default function DayOnePage() {
  return (
    <article className={`day-one ${sourceSerif.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
      <DayOneProgress />
      <header className="day-hero">
        <div className="day-hero-image"><Image src="/blog/day-1/cove-night.webp" alt="A dark rocky cove opening into the sea near Torroella de Montgrí" fill priority sizes="100vw" style={{ objectFit: "cover" }} /></div>
        <PhotoMetadata settings={settings.cove} />
        <div className="day-hero-copy">
          <div className="day-kicker">A field note on fear, freedom and very bad planning</div>
          <h1 className="day-title">There has to be a DAY 1</h1>
          <p className="day-deck">I did not stop being scared. I just did some of it while being scared.</p>
          <div className="day-meta"><span>01–08 September 2026</span><span>12 min read</span><span>Words & photographs by Soham Kakra</span></div>
        </div>
      </header>

      <div className="day-route" aria-label="Trip route">
        <div className="day-route-inner">
          {[["01 Sep", "Eindhoven"], ["01 Sep", "Luxembourg"], ["02 Sep", "Barcelona"], ["03 Sep", "Montserrat"], ["04–08 Sep", "Torroella de Montgrí"]].map(([date, city], index, all) => (
            <div key={city} style={{ display: "contents" }}><div className="day-route-stop"><span className="day-route-label">{date}</span><span className="day-route-city">{city}</span></div>{index < all.length - 1 && <div className="day-route-line" />}</div>
          ))}
        </div>
      </div>

      <main className="day-article">
        <section className="day-section">
          <div className="day-section-head"><span className="day-index">00 / COLD OPEN</span><h2>Great planning, Soham!</h2><span className="day-stamp">08 September · somewhere outside L&apos;Estartit</span></div>
          <div className="day-copy">
            <p>I was alone, wet, freezing, out of water, and watching lightning tear through the sky.</p>
            <p>My shorts were soaked because, of course, I had forgotten my swim wear. Had no tent, no water left in my bottle. It was already dark and the only way back was through a forest on a badly marked trail.</p>
            <p>I kept remembering something I had heard as a kid. When there is lightning, avoid being outside. Also avoid trees. Not even sure if that&apos;s true.</p>
            <p className="day-big">Guess where I was.</p>
            <p>Started running uphill using my phone&apos;s torch for a few seconds at a time, then switched it off to save battery. No map, just trying to recognise the same rocks and turns I had passed on the way down.</p>
            <p>For the first time that evening, I was properly thinking about death.</p>
            <p>Maybe I am overhyping the whole thing. But in that moment, for me, it was a true fucking adventure. And I absolutely loved every second of it.</p>
          </div>
        </section>

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">01 / THE ROAD</span><h2>Thirty hours on a bus</h2><span className="day-stamp">Eindhoven → Luxembourg → Paris → Barcelona</span></div>
          <div className="day-copy">
            <p>The trip started from my home in Eindhoven with a bus ride that lasted nearly 30 hours.</p>
            <p>It was not glamorous. It was long, tiring and probably an unnecessarily difficult way to reach Spain. Which is exactly the kind of travel I somehow keep choosing.</p>
            <p>That&apos;s how I met random strangers whose names I didn&apos;t even ask, and we still spoke for hours, unable to sleep.</p>
            <p>I can afford the flights and nice hotels. I too like a comfortable bed. But carrying a stupidly heavy bag full of camera equipment across stations and up mountains gives me a feeling that a clean, comfy hotel room just doesn&apos;t.</p>
            <p>Maybe the struggle makes the arrival feel earned. Maybe I just enjoy making life difficult for myself. Idk man, it&apos;s not easy but that&apos;s what I love about it.</p>
          </div>
        </section>
        <Photo src="/blog/day-1/luxembourg-road.webp" alt="Luxembourg at dawn, with an arched bridge leading towards the city" caption="A change somewhere inside those thirty hours" note="Luxembourg · 01 Sep" settings={settings.luxembourg} />

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">02 / BARCELONA</span><h2>Dancing like kids</h2><span className="day-stamp">02 September · 32,455 steps</span></div>
          <div className="day-copy">
            <p>My first night in Barcelona, I went to a rave with random people I had met at the hostel.</p>
            <p>It was not a club. It was a silent disco in front of the Sagrada Família. To tourists walking past, we probably looked like a bunch of idiots dancing to absolutely nothing.</p>
            <p>Honestly, that made it even better.</p>
            <p>The couple organising it spoke about their journey and how they had stumbled into creating something this fun. They got extra headsets and pulled people from the crowd into it. People who had arrived to look at a monument suddenly ended up dancing with complete strangers.</p>
            <p className="day-big">For a while everyone forgot how adults are “supposed” to behave.</p>
            <p>We danced like kids in a playground, so full of life.</p>
            <Reference href="https://links.nichuzz.com/monument-tour/barcelona.html" label="Original event" title="Vibe Rise · Monument Rave Barcelona" />
          </div>
          <div className="day-stat-row"><div className="day-stat"><strong>32,455</strong><span>steps · rave night</span></div><div className="day-stat"><strong>22,491</strong><span>steps · Montserrat</span></div><div className="day-stat"><strong>21K</strong><span>steps · no sleep</span></div></div>
        </section>
        <Photo src="/blog/day-1/barcelona-cathedral.webp" alt="A cathedral facade rising into a deep blue Barcelona sky" caption="Barcelona, before the city turned into a dance floor" note="Barcelona · 02 Sep" settings={settings.barcelona} />

        <section className="day-section wide">
          <div className="day-section-head"><span className="day-index">03 / MONTSERRAT</span><h2>Not a hike. A workout.</h2><span className="day-stamp">03 September · barely any sleep</span></div>
          <div className="day-copy">
            <p>I climbed idk how many steps. Every time it looked like they should end, there were more.</p>
            <p>Around me were these massive, almost pencil-like smooth boulders that looked unreal. Then I saw a bunch of old men with white hair and dad-bods climbing them with headgear, ropes and carabiners and thought, okay, what exactly is my excuse for not being able to do that?</p>
            <p className="day-punch">It was so fucking inspirational.</p>
            <p>That night I also went clubbing until the next morning and covered another 21k steps. We stayed up all night and had one of those conversations that makes time disappear.</p>
            <p>At 10 in the morning, with no sleep, I left for L&apos;Estartit. Very sensible behaviour throughout.</p>
          </div>
        </section>
        <div className="day-diptych"><div><Image src="/blog/day-1/montserrat-rocks.webp" alt="The huge rounded rock formations at Montserrat" fill sizes="(max-width: 720px) 95vw, 65vw" style={{ objectFit: "cover" }} /><PhotoMetadata settings={settings.montserrat} /></div><div><Image src="/blog/day-1/montserrat-stairs.webp" alt="Stone stairs climbing through Montserrat with the moon above" fill sizes="(max-width: 720px) 95vw, 35vw" style={{ objectFit: "cover" }} /><PhotoMetadata settings={settings.montserrat} /></div></div>
        <Photo src="/blog/day-1/estartit-harbour.webp" alt="The harbour and mountain at L'Estartit" caption="I arrived on no sleep and finally stopped moving" note="L'Estartit · 04 Sep" settings={settings.harbour} />

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">04 / UNDERWATER</span><h2>The person who panics in deep water</h2><span className="day-stamp">04–08 September · L&apos;Estartit</span></div>
          <div className="day-copy">
            <p>I am terrified of deep water. I cannot even swim properly. I have had multiple near-drowning experiences because the second my feet stop touching the bottom of a pool, I panic.</p>
            <p>That same me signed up for a four-day scuba diving course.</p>
            <p>I did not suddenly become fearless when I put the equipment on. I still had to control my breathing and stop my mind from running through everything that could go wrong. Thanks to one of the best instructors and some fun people learning alongside me, I really was able to get control of my breathing.</p>
            <p>And I kept going back into the water.</p>
            <p className="day-big">Being scared and doing something are not opposites. They can happen simultaneously.</p>
          </div>
        </section>
        <Photo src="/blog/day-1/underwater-blue.webp" alt="A pale rock surrounded by clear blue Mediterranean water" caption="I could not photograph the world below, so this is the water above it" note="L'Estartit · 05 Sep" settings={settings.underwater} />

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">05 / MEDES ISLANDS</span><h2>Fifteen metres below</h2><span className="day-stamp">08 September · final dive</span></div>
          <div className="day-copy">
            <p>There were corals and more fish than I could process. Tiny ones, massive ones, a world so colourful and all natural? I wish I had better words for what it looked like, but I don&apos;t.</p>
            <p>Fun fact: I couldn&apos;t really see far away without my glasses. But whatever I saw got me hooked enough to want to invest more time and resources into this.</p>
            <p>At just 15 metres below sea level, there&apos;s a whole new world. Just RAW nature, doing what it does best, existing.</p>
            <p>You can feel every breath. You notice every muscle you move. You are not standing or falling. You are just floating, feeling weightless.</p>
            <p>For someone whose body normally panics when his feet cannot find the bottom, that feeling was insane.</p>
          </div>
        </section>
        <Photo src="/blog/day-1/medes-island.webp" alt="A Medes island beneath a stormy sky" caption="Somewhere beneath that water, time slowed down" note="Medes Islands · 08 Sep" settings={settings.medes} />

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">06 / TORROELLA DE MONTGRÍ</span><h2>The cove</h2><span className="day-stamp">08 September · late afternoon</span></div>
          <div className="day-copy">
            <p>The cliffs overlooked this massive stretch of sea. It felt like it all belonged to me because I was the only one there to look at it, yet it made me realise how insignificant I am. How insignificant my problems and worries are.</p>
            <p>The sky kept changing colours from orange to wine-like red. The leaves were so green they looked like someone had pushed the saturation slider all the way up.</p>
            <p>I reached a valley-like opening with a small beach between the rocks. There were four people and a dog there and after a while, even they left.</p>
            <p>Then it was just me and the ecosystem around me.</p>
            <p className="day-big">I smiled. I screamed. I cried. I missed my mom. I smiled again.</p>
            <p>I tried to shoot videos and messed up the settings so badly that they came out completely black. Perfect visual documentation of a life-changing moment.</p>
          </div>
        </section>
        <Photo src="/blog/day-1/trail-overlook.webp" alt="A rocky pine-covered headland opening towards the Mediterranean" caption="What I thought would be a small hike" note="Torroella de Montgrí · 08 Sep" settings={settings.trail} />
        <Photo src="/blog/day-1/cliffs.webp" alt="A vast orange cliff meeting the Mediterranean Sea" caption="It felt like I was living a movie, a dream" note="Costa Brava · 08 Sep" settings={settings.cliffs} />

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">07 / THE EDGE</span><h2>The thing I couldn&apos;t do</h2></div>
          <div className="day-copy">
            <p>I climbed around the rocks with my bare hands and feet. Twisted my ankles multiple times. Got cuts on my feet. Slipped on soft moss. Surprised how I still haven&apos;t broken a bone yet.</p>
            <p>At one point my feet could not feel the bottom. I still panicked. I swam a little anyway, in whatever stupid way I know how to.</p>
            <p>Then I did a small dive from merely a metre or two. Probably insignificant to someone who can swim. For me, all alone, it felt scary.</p>
            <p>I jumped anyway.</p>
            <p>Then I wanted to do a backflip. I had done a few before. But this time I kept walking to the edge and freezing.</p>
            <p>What if I slipped? What if I hit my head? What if I blacked out in the water?</p>
            <p>My body refused to obey me. Maybe because I had just seen what my life could be like. I felt alive, and I wanted to live more moments like that while, ofc, trying to stay alive.</p>
            <p className="day-big">So I couldn&apos;t do it.</p>
            <p>Maybe fear was protecting me. Maybe it was the right decision. I don&apos;t know.</p>
          </div>
        </section>
        <Photo src="/blog/day-1/cliff-edge.webp" alt="A view down a pale cliff face into deep blue water" caption="I kept walking up to the edge and freezing" note="Costa Brava · 08 Sep" settings={settings.edge} />

        <section className="day-storm">
          <div className="day-storm-image" data-parallax><Image src="/blog/day-1/cove-night.webp" alt="The cove after darkness arrived" fill sizes="100vw" style={{ objectFit: "cover" }} /></div>
          <PhotoMetadata settings={settings.cove} />
          <div className="day-storm-copy"><p>Lightning so bright it made midnight look like noon for a split second.</p><span>Then the adventure stopped feeling cinematic</span></div>
        </section>

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">08 / THE STORM</span><h2>So naturally, I ran.</h2></div>
          <div className="day-copy">
            <p>No dry clothes. No water. No tent. No proper light. A low phone battery. A route back through trees. Nobody around.</p>
            <p>Somehow I found the trail. Somehow I retraced the steps back up. Somehow I reached the top and walked out into the street lights.</p>
            <p>The lightning was still there, but I was suddenly less afraid. Strange feeling. Nothing about the storm had changed. The only difference was that there was now civilisation around me again.</p>
            <p>On the trail I had been thinking about dying. Back in the city I could finally tell myself that I had just experienced one of the best days of my life.</p>
            <p className="day-punch">Really fucking happy.</p>
          </div>
        </section>
        <Photo src="/blog/day-1/sea-rock.webp" alt="A solitary rock in a calm blue sea" caption="Nothing about the storm had changed. I had." note="Costa Brava · 08 Sep" settings={settings.sea} portrait />

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">09 / THE WHY</span><h2>Of course I&apos;m scared.</h2></div>
          <div className="day-copy">
            <p>I&apos;m scared of heights. I&apos;m scared of deep water. I&apos;m scared of failing at the thing I actually want to do, of embarrassment, not just in front of people but in front of myself. I&apos;m scared of looking weak, of losing to someone, and also the opposite, of someone else winning by beating me. I&apos;m scared of talking to strangers, meeting new people, meeting old friends (whattt!? that should be easy, right? umm nope, what if they think I&apos;m still “uncool” after all these years).</p>
            <p>I&apos;m scared of so many more things, things I probably haven&apos;t even learnt I&apos;m scared of yet. Does that make any sense? Probably not.</p>
            <p>“Wait, wasn&apos;t this supposed to be about overcoming fear?” Yeah. I did all of the stuff above, and I&apos;m still scared. The fear just gets quieter the more you do it, the more consistent you are. Not sure it ever truly leaves.</p>
            <p>So how do you do it? Nike figured it out ages ago. Just do it. That&apos;s all it takes, mate. And if you need to hype yourself up first, try saying “JUST FUCKING DO IT” to yourself. No one else has to hear it, it&apos;s you who needs to.</p>
            <p>Simple, not easy. My dad always tells me our brains are wired to do as little work as possible. One part of you just wants to chill and give everything a rain check. The other part is curious, greedy, never satisfied. I kept letting the lazy part win, not cuz it&apos;s wrong to be that way, but cuz I never stretched its comfort zone enough to make room for the other one. (Ofc this is my theory, not science. I don&apos;t fully understand it either.)</p>
            <p>For a long time I was also jealous. Of peers, of people I CHOSE to follow on Instagram, who all seemed to have figured out their why before me. I wasted so much time envying them. Then one day it was just, “that&apos;s it, no more.” I started feeling proud of them instead, thinking about how much work they must have put in. It turned into a kind of attraction, the kind that doesn&apos;t make you want to be like them, it makes you want to find what you mean to yourself.</p>
            <p>Somewhere along the way, trying to please everyone, trying to make other people happy even if it destroyed mine, I lost the child in me. The one who was happy just existing, who did “crazy” stuff and didn&apos;t give a fuck what other people thought. My childhood friends probably know exactly what I&apos;m talking about. I missed that about me.</p>
            <p className="day-big">I wanted that back. There you go, that was my why.</p>
            <p>A why has to be yours though. Bespoke, tailored by your own thoughts. Mine came from trial and error, and from stuff I&apos;d seen long back and forgotten about, like this talk, which my brain decided to resurface right when I needed it.</p>
            <Reference href="https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action" label="A thought that stayed with me" title="Simon Sinek · How Great Leaders Inspire Action" />
          </div>
        </section>

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">10 / CONTROL</span><h2>Not proud of this one.</h2></div>
          <div className="day-copy">
            <p>It&apos;s not easy admitting flaws, but since I&apos;m here doing it.</p>
            <p>I was living alone, feeling lonely, and I let it consume me. I picked up habits I told myself I&apos;d never ever do, and I hit rock bottom when I smoked my first cigarette. (Not saying people who smoke are bad. It&apos;s just that since childhood my mom and brother told me the one thing I should never do is smoke.)</p>
            <p>I felt guilty, and then I was like ahhh who the fuck cares, my mom&apos;s gone, she can&apos;t tell me what to do anymore. It felt like a way to control my life the way I wanted to. And yes 😅 I genuinely looked at it as an accomplishment. Wow, my first cigarette, I now know how to smoke.</p>
            <p>There are more “bad” habits. The kind where you get the thrill and wake up the next morning feeling guilty as hell (yes, Maroon 5). Not telling you what they are yet, cuz I haven&apos;t beaten them. But this is a note for you: hold me accountable. Once I do get rid of them, I&apos;ll tell you how, in case you&apos;re stuck with the same ones.</p>
            <p>I don&apos;t claim I&apos;m a changed man. But I do feel a lot happier now, a lot more confident in myself and in the people around me. I started seeing the good in people I used to judge for not aligning with my values. Friends, family, ffs even loved ones. I&apos;m a nobody to judge anyone anyway.</p>
          </div>
        </section>

        <section className="day-section">
          <div className="day-section-head"><span className="day-index">11 / I DON&apos;T KNOW</span><h2>Still figuring it out.</h2></div>
          <div className="day-copy">
            <p>“So Soham, have you figured it all out now?” Haha, no. I don&apos;t know if fear ever properly leaves, and I don&apos;t know how many of the ideas in my head will ever see the light of day.</p>
            <p>But something did change on this trip. I came back excited. Excited to learn more and see what I can actually produce in my field. Excited to take on new projects. I genuinely can&apos;t wait to get started.</p>
            <p>I want to learn a bit of everything, enough to have a proper conversation with someone who knows more than me, or someone who wants to learn too. Seems like way too much for one lifetime. Probably worth it.</p>
            <p>I don&apos;t want to imagine what tomorrow looks like and set expectations for it. I want life to keep surprising me, inspiring me. (Yes, that&apos;s from ZNMD, and I truly only understood it now.)</p>
            <p className="day-big">I want to live like a dog. Just happy in every moment. Even when I&apos;m sad, I want to be happy about being sad.</p>
            <Reference href="https://www.imdb.com/title/tt1562872/" label="A film I finally understood" title="Zindagi Na Milegi Dobara" />
          </div>
        </section>
      </main>

      <footer className="day-ending">
        <p>I wrote the original rant sitting at the campsite bar after running back up that trail, a 1.5 litre bottle of water on the counter to quench my thirst, chatting with the bartender and his girlfriend. What a beautiful evening that was.</p>
        <p>Sometimes one “hi” is enough to open an entirely different version of an evening.</p>
        <p>I want to be able to love myself. One step at a time ig.</p>
        <p>Love you, Mom. Thank you for all the love and care you gave me. I could not be more grateful.</p>
        <h2>There fucking has to be a DAY 1.</h2>
      </footer>
    </article>
  );
}
