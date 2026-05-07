import { Schema } from 'effect';

export const Text = Schema.Struct({
  en: Schema.NonEmptyString,
  fr: Schema.NonEmptyString,
});
export type Text = typeof Text.Type;

const noLeadingSlash = Schema.makeFilter<string>(
  (s) => (s.startsWith('/') ? 'must not start with "/"' : undefined),
  { title: 'NoLeadingSlash' },
);

const NoLeadingSlash = Schema.NonEmptyString.check(noLeadingSlash);

export const ImageRef = Schema.Struct({
  key: NoLeadingSlash,
  alt: Text,
  width: Schema.Int.check(Schema.isGreaterThan(0)),
  height: Schema.Int.check(Schema.isGreaterThan(0)),
});
export type ImageRef = typeof ImageRef.Type;

export const imageSrc = (ref: ImageRef): string => `/${ref.key}`;

const NavLink = Schema.Struct({
  href: Schema.NonEmptyString,
  label: Text,
});

const HoursRow = Schema.Struct({
  day: Text,
  hours: Text,
});

const CarouselItem = Schema.Struct({
  image: ImageRef,
  description: Text,
});

const Meta = Schema.Struct({
  title: Text,
  description: Text,
  ogImage: ImageRef,
});

const Header = Schema.Struct({
  logo: ImageRef,
  navLinks: Schema.Array(NavLink),
  orderOnlineUrl: Schema.NonEmptyString,
  orderLong: Text,
  orderShort: Text,
  openMenuLabel: Text,
  closeMenuLabel: Text,
});

const HeroCta = Schema.Struct({
  href: Schema.NonEmptyString,
  label: Text,
});

const Hero = Schema.Struct({
  since: Text,
  headline: Text,
  tagline: Text,
  ctaPrimary: HeroCta,
  ctaSecondary: HeroCta,
});

const AboutBullet = Text;

const About = Schema.Struct({
  heading: Text,
  subheading: Text,
  intro: Text,
  storyHeading: Text,
  storyBullets: Schema.Array(AboutBullet),
  valuesHeading: Text,
  valueBullets: Schema.Array(AboutBullet),
  promiseHeading: Text,
  promise: Text,
  since: Text,
  image: ImageRef,
});

const Menu = Schema.Struct({
  heading: Text,
  intro: Text,
  carousel: Schema.Array(CarouselItem),
  pdfHeading: Text,
  pdfBody: Text,
  pdfCta: Text,
  pdfHref: Schema.NonEmptyString,
  disclaimer: Text,
});

const Location = Schema.Struct({
  heading: Text,
  mapEmbedSrc: Schema.NonEmptyString,
  mapTitle: Text,
  addressHeading: Text,
  addressLines: Schema.Array(Schema.NonEmptyString),
  hoursHeading: Text,
  hours: Schema.Array(HoursRow),
});

export const SocialKind = Schema.Literals(['instagram', 'facebook']);
export type SocialKind = typeof SocialKind.Type;

const ContactSocial = Schema.Struct({
  kind: SocialKind,
  href: Schema.NonEmptyString,
  ariaLabel: Text,
});

const Contact = Schema.Struct({
  heading: Text,
  formHeading: Text,
  phoneLabel: Text,
  phoneDisplay: Schema.NonEmptyString,
  phoneTel: Schema.NonEmptyString,
  emailLabel: Text,
  emailAddress: Schema.NonEmptyString,
  followLabel: Text,
  socials: Schema.Array(ContactSocial),
});

const Footer = Schema.Struct({
  logo: ImageRef,
  tagline: Text,
  quickLinksHeading: Text,
  quickLinks: Schema.Array(NavLink),
  contactInfoHeading: Text,
  contactInfoLines: Schema.Array(Schema.NonEmptyString),
  hoursHeading: Text,
  hoursSummary: Text,
  rightsLine: Text,
});

const PostalAddress = Schema.Struct({
  streetAddress: Schema.NonEmptyString,
  addressLocality: Schema.NonEmptyString,
  addressRegion: Schema.NonEmptyString,
  postalCode: Schema.NonEmptyString,
  addressCountry: Schema.NonEmptyString,
});

const OpeningHoursSpec = Schema.Struct({
  dayOfWeek: Schema.Union([Schema.NonEmptyString, Schema.Array(Schema.NonEmptyString)]),
  opens: Schema.NonEmptyString,
  closes: Schema.NonEmptyString,
});

const JsonLd = Schema.Struct({
  name: Schema.NonEmptyString,
  telephone: Schema.NonEmptyString,
  email: Schema.NonEmptyString,
  imageKey: NoLeadingSlash,
  menuPath: Schema.NonEmptyString,
  servesCuisine: Schema.Array(Schema.NonEmptyString),
  priceRange: Schema.NonEmptyString,
  address: PostalAddress,
  openingHours: Schema.Array(OpeningHoursSpec),
  sameAs: Schema.Array(Schema.NonEmptyString),
});

export const SiteContent = Schema.Struct({
  meta: Meta,
  header: Header,
  hero: Hero,
  about: About,
  menu: Menu,
  location: Location,
  contact: Contact,
  footer: Footer,
  jsonLd: JsonLd,
});
export type SiteContent = typeof SiteContent.Type;
