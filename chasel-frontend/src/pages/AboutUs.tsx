import StaticPage from '../components/StaticPage';

function AboutUs() {
  return (
    <StaticPage
      eyebrow="Our story"
      title="About Chasel"
      intro="Chasel is a considered marketplace for authenticated, pre-loved fashion and objects — built for people who believe great pieces deserve a second chapter."
      sections={[
        {
          heading: 'Why we started',
          body: [
            'Too many well-made things are worn once and forgotten. Chasel exists to give considered pieces — clothing, accessories, and objects with real craft behind them — a way to find their next owner instead of a landfill.',
            'We built a marketplace around care rather than volume: fewer, better listings, described honestly, from sellers who know the value of what they’re passing on.',
          ],
        },
        {
          heading: 'How it works',
          body: [
            'Sellers list pieces with detailed condition notes, honest photos, and fair pricing. Buyers browse a curated feed instead of an endless scroll, and every conversation happens through the platform so both sides are protected.',
            'When a piece sells, we support the handoff end to end — from messaging and payment to shipping guidance — so trading secondhand feels as easy as buying new.',
          ],
        },
        {
          heading: 'Our standards',
          body: [
            'Every listing on Chasel is expected to meet our community guidelines: accurate descriptions, real photos of the actual item, and fair, transparent pricing.',
            'We’d rather grow slowly with a community we trust than quickly with one we don’t.',
          ],
        },
        {
          heading: 'Get in touch',
          body: [
            'Questions, feedback, or just want to say hello? Reach us any time at hello@chasel.example — we read everything.',
          ],
        },
      ]}
    />
  );
}

export default AboutUs;
