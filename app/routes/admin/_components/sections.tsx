import { useState } from 'react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import type { ImageRef, SiteContent, SocialKind, Text } from '~/content/schema';

import {
  type AssetOption,
  ImageRefField,
} from './asset-picker';
import {
  ArrayField,
  SelectField,
  StringField,
  StructField,
  TextField,
} from './form-fields';

type SectionProps<K extends keyof SiteContent> = {
  readonly name: string;
  readonly defaultValue: SiteContent[K];
  readonly assets: readonly AssetOption[];
};

const expectNoFields = (_value: Record<PropertyKey, never>): void => {};

const emptyText: Text = { en: '', fr: '' };
const emptyImage: ImageRef = {
  key: 'indoor.avif',
  alt: emptyText,
  width: 1,
  height: 1,
};

export const MENU_PDF_UPLOAD_FORM_ID = 'menu-pdf-upload-form';

const socialOptions: readonly { value: SocialKind; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
];

const expectMenuFieldsHandled = (
  _value: Record<keyof SiteContent['menu'], true>,
): void => {};

expectMenuFieldsHandled({
  heading: true,
  intro: true,
  carousel: true,
  pdfHeading: true,
  pdfBody: true,
  pdfCta: true,
  pdfHref: true,
  disclaimer: true,
});

function NavLinkFields({
  name,
  defaultValue,
}: {
  readonly name: string;
  readonly defaultValue: SiteContent['header']['navLinks'][number];
}) {
  const { href, label, ...unhandled } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-3">
      <StringField name={`${name}.href`} defaultValue={href} label="Href" />
      <TextField name={`${name}.label`} defaultValue={label} label="Label" />
    </div>
  );
}

function CtaFields({
  name,
  defaultValue,
}: {
  readonly name: string;
  readonly defaultValue: SiteContent['hero']['ctaPrimary'];
}) {
  const { href, label, ...unhandled } = defaultValue;
  expectNoFields(unhandled);
  return (
    <StructField label="CTA">
      <StringField name={`${name}.href`} defaultValue={href} label="Href" />
      <TextField name={`${name}.label`} defaultValue={label} label="Label" />
    </StructField>
  );
}

function HoursRowFields({
  name,
  defaultValue,
}: {
  readonly name: string;
  readonly defaultValue: SiteContent['location']['hours'][number];
}) {
  const { day, hours, ...unhandled } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-3">
      <TextField name={`${name}.day`} defaultValue={day} label="Day" />
      <TextField name={`${name}.hours`} defaultValue={hours} label="Hours" />
    </div>
  );
}

function MenuPdfUploadField({
  name,
  href,
}: {
  readonly name: string;
  readonly href: string;
}) {
  const [picked, setPicked] = useState<File | null>(null);
  const publicHref = href.startsWith('/') ? href : `/${href}`;

  return (
    <StructField label="Menu PDF">
      <input type="hidden" name={name} value={href} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline"
        >
          Open current PDF
        </a>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            form={MENU_PDF_UPLOAD_FORM_ID}
            type="file"
            name="file"
            accept="application/pdf"
            required
            onChange={(event) => {
              setPicked(event.currentTarget.files?.[0] ?? null);
            }}
            className="cursor-pointer sm:max-w-[16rem]"
          />
          <Button
            form={MENU_PDF_UPLOAD_FORM_ID}
            type="submit"
            variant="outline"
            disabled={picked === null}
            className="w-full sm:w-auto"
          >
            Upload PDF
          </Button>
        </div>
      </div>
    </StructField>
  );
}

export function MetaSection({
  name,
  defaultValue,
  assets,
}: SectionProps<'meta'>) {
  const { title, description, ogImage, ...unhandled } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-4">
      <TextField name={`${name}.title`} defaultValue={title} label="Title" />
      <TextField
        name={`${name}.description`}
        defaultValue={description}
        label="Description"
        multiline
      />
      <ImageRefField
        name={`${name}.ogImage`}
        defaultValue={ogImage}
        label="Open Graph image"
        assets={assets}
      />
    </div>
  );
}

export function HeaderSection({
  name,
  defaultValue,
  assets,
}: SectionProps<'header'>) {
  const {
    logo,
    navLinks,
    orderOnlineUrl,
    orderLong,
    orderShort,
    openMenuLabel,
    closeMenuLabel,
    ...unhandled
  } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-4">
      <ImageRefField name={`${name}.logo`} defaultValue={logo} label="Logo" assets={assets} />
      <ArrayField
        name={`${name}.navLinks`}
        defaultValue={navLinks}
        label="Navigation links"
        newItem={() => ({ href: '#', label: emptyText })}
        renderItem={(item, rowName) => (
          <NavLinkFields name={rowName} defaultValue={item} />
        )}
      />
      <StringField
        name={`${name}.orderOnlineUrl`}
        defaultValue={orderOnlineUrl}
        label="Order online URL"
        type="url"
      />
      <TextField name={`${name}.orderLong`} defaultValue={orderLong} label="Order long" />
      <TextField name={`${name}.orderShort`} defaultValue={orderShort} label="Order short" />
      <TextField
        name={`${name}.openMenuLabel`}
        defaultValue={openMenuLabel}
        label="Open menu label"
      />
      <TextField
        name={`${name}.closeMenuLabel`}
        defaultValue={closeMenuLabel}
        label="Close menu label"
      />
    </div>
  );
}

export function HeroSection({ name, defaultValue }: SectionProps<'hero'>) {
  const { since, headline, tagline, ctaPrimary, ctaSecondary, ...unhandled } =
    defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-4">
      <TextField name={`${name}.since`} defaultValue={since} label="Since" />
      <TextField name={`${name}.headline`} defaultValue={headline} label="Headline" />
      <TextField name={`${name}.tagline`} defaultValue={tagline} label="Tagline" />
      <CtaFields name={`${name}.ctaPrimary`} defaultValue={ctaPrimary} />
      <CtaFields name={`${name}.ctaSecondary`} defaultValue={ctaSecondary} />
    </div>
  );
}

export function AboutSection({
  name,
  defaultValue,
  assets,
}: SectionProps<'about'>) {
  const {
    heading,
    subheading,
    intro,
    storyHeading,
    storyBullets,
    valuesHeading,
    valueBullets,
    promiseHeading,
    promise,
    since,
    image,
    ...unhandled
  } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-4">
      <TextField name={`${name}.heading`} defaultValue={heading} label="Heading" />
      <TextField name={`${name}.subheading`} defaultValue={subheading} label="Subheading" />
      <TextField name={`${name}.intro`} defaultValue={intro} label="Intro" multiline />
      <TextField
        name={`${name}.storyHeading`}
        defaultValue={storyHeading}
        label="Story heading"
      />
      <ArrayField
        name={`${name}.storyBullets`}
        defaultValue={storyBullets}
        label="Story bullets"
        newItem={() => emptyText}
        renderItem={(item, rowName) => (
          <TextField name={rowName} defaultValue={item} label="Bullet" multiline />
        )}
      />
      <TextField
        name={`${name}.valuesHeading`}
        defaultValue={valuesHeading}
        label="Values heading"
      />
      <ArrayField
        name={`${name}.valueBullets`}
        defaultValue={valueBullets}
        label="Value bullets"
        newItem={() => emptyText}
        renderItem={(item, rowName) => (
          <TextField name={rowName} defaultValue={item} label="Bullet" multiline />
        )}
      />
      <TextField
        name={`${name}.promiseHeading`}
        defaultValue={promiseHeading}
        label="Promise heading"
      />
      <TextField name={`${name}.promise`} defaultValue={promise} label="Promise" multiline />
      <TextField name={`${name}.since`} defaultValue={since} label="Since" />
      <ImageRefField name={`${name}.image`} defaultValue={image} label="Image" assets={assets} />
    </div>
  );
}

export function MenuSection({
  name,
  defaultValue,
  assets,
}: SectionProps<'menu'>) {
  const { heading, intro, carousel } = defaultValue;
  return (
    <div className="space-y-4">
      <TextField name={`${name}.heading`} defaultValue={heading} label="Heading" />
      <TextField name={`${name}.intro`} defaultValue={intro} label="Intro" multiline />
      <ArrayField
        name={`${name}.carousel`}
        defaultValue={carousel}
        label="Carousel"
        newItem={() => ({ image: emptyImage, description: emptyText })}
        renderItem={(item, rowName) => {
          const { image, description, ...itemUnhandled } = item;
          expectNoFields(itemUnhandled);
          return (
            <div className="space-y-3">
              <ImageRefField
                name={`${rowName}.image`}
                defaultValue={image}
                label="Image"
                assets={assets}
              />
              <TextField
                name={`${rowName}.description`}
                defaultValue={description}
                label="Description"
                multiline
              />
            </div>
          );
        }}
      />
    </div>
  );
}

export function MenuPdfSection({
  name,
  defaultValue,
}: SectionProps<'menu'>) {
  const { pdfHeading, pdfBody, pdfCta, pdfHref, disclaimer } = defaultValue;
  return (
    <div className="space-y-4">
      <TextField
        name={`${name}.pdfHeading`}
        defaultValue={pdfHeading}
        label="PDF heading"
      />
      <TextField name={`${name}.pdfBody`} defaultValue={pdfBody} label="PDF body" multiline />
      <TextField name={`${name}.pdfCta`} defaultValue={pdfCta} label="PDF CTA" />
      <MenuPdfUploadField name={`${name}.pdfHref`} href={pdfHref} />
      <TextField
        name={`${name}.disclaimer`}
        defaultValue={disclaimer}
        label="Disclaimer"
        multiline
      />
    </div>
  );
}

export function LocationSection({
  name,
  defaultValue,
}: SectionProps<'location'>) {
  const {
    heading,
    mapEmbedSrc,
    mapTitle,
    addressHeading,
    addressLines,
    hoursHeading,
    hours,
    ...unhandled
  } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-4">
      <TextField name={`${name}.heading`} defaultValue={heading} label="Heading" />
      <StringField
        name={`${name}.mapEmbedSrc`}
        defaultValue={mapEmbedSrc}
        label="Map embed URL"
        type="url"
      />
      <TextField name={`${name}.mapTitle`} defaultValue={mapTitle} label="Map title" />
      <TextField
        name={`${name}.addressHeading`}
        defaultValue={addressHeading}
        label="Address heading"
      />
      <ArrayField
        name={`${name}.addressLines`}
        defaultValue={addressLines}
        label="Address lines"
        newItem={() => ''}
        renderItem={(item, rowName) => (
          <StringField name={rowName} defaultValue={item} label="Line" />
        )}
      />
      <TextField
        name={`${name}.hoursHeading`}
        defaultValue={hoursHeading}
        label="Hours heading"
      />
      <ArrayField
        name={`${name}.hours`}
        defaultValue={hours}
        label="Hours"
        newItem={() => ({ day: emptyText, hours: emptyText })}
        renderItem={(item, rowName) => (
          <HoursRowFields name={rowName} defaultValue={item} />
        )}
      />
    </div>
  );
}

export function ContactSection({
  name,
  defaultValue,
}: SectionProps<'contact'>) {
  const {
    heading,
    formHeading,
    phoneLabel,
    phoneDisplay,
    phoneTel,
    emailLabel,
    emailAddress,
    followLabel,
    socials,
    ...unhandled
  } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-4">
      <TextField name={`${name}.heading`} defaultValue={heading} label="Heading" />
      <TextField
        name={`${name}.formHeading`}
        defaultValue={formHeading}
        label="Form heading"
      />
      <TextField
        name={`${name}.phoneLabel`}
        defaultValue={phoneLabel}
        label="Phone label"
      />
      <StringField
        name={`${name}.phoneDisplay`}
        defaultValue={phoneDisplay}
        label="Phone display"
        type="tel"
      />
      <StringField name={`${name}.phoneTel`} defaultValue={phoneTel} label="Phone tel" />
      <TextField
        name={`${name}.emailLabel`}
        defaultValue={emailLabel}
        label="Email label"
      />
      <StringField
        name={`${name}.emailAddress`}
        defaultValue={emailAddress}
        label="Email address"
        type="email"
      />
      <TextField
        name={`${name}.followLabel`}
        defaultValue={followLabel}
        label="Follow label"
      />
      <ArrayField
        name={`${name}.socials`}
        defaultValue={socials}
        label="Social links"
        newItem={() => ({
          kind: 'instagram' as const,
          href: '',
          ariaLabel: emptyText,
        })}
        renderItem={(item, rowName) => {
          const { kind, href, ariaLabel, ...itemUnhandled } = item;
          expectNoFields(itemUnhandled);
          return (
            <div className="space-y-3">
              <SelectField
                name={`${rowName}.kind`}
                defaultValue={kind}
                label="Kind"
                options={socialOptions}
              />
              <StringField name={`${rowName}.href`} defaultValue={href} label="Href" type="url" />
              <TextField
                name={`${rowName}.ariaLabel`}
                defaultValue={ariaLabel}
                label="ARIA label"
              />
            </div>
          );
        }}
      />
    </div>
  );
}

export function FooterSection({
  name,
  defaultValue,
  assets,
}: SectionProps<'footer'>) {
  const {
    logo,
    tagline,
    quickLinksHeading,
    quickLinks,
    contactInfoHeading,
    contactInfoLines,
    rightsLine,
    ...unhandled
  } = defaultValue;
  expectNoFields(unhandled);
  return (
    <div className="space-y-4">
      <ImageRefField name={`${name}.logo`} defaultValue={logo} label="Logo" assets={assets} />
      <TextField name={`${name}.tagline`} defaultValue={tagline} label="Tagline" />
      <TextField
        name={`${name}.quickLinksHeading`}
        defaultValue={quickLinksHeading}
        label="Quick links heading"
      />
      <ArrayField
        name={`${name}.quickLinks`}
        defaultValue={quickLinks}
        label="Quick links"
        newItem={() => ({ href: '#', label: emptyText })}
        renderItem={(item, rowName) => (
          <NavLinkFields name={rowName} defaultValue={item} />
        )}
      />
      <TextField
        name={`${name}.contactInfoHeading`}
        defaultValue={contactInfoHeading}
        label="Contact info heading"
      />
      <ArrayField
        name={`${name}.contactInfoLines`}
        defaultValue={contactInfoLines}
        label="Contact info lines"
        newItem={() => ''}
        renderItem={(item, rowName) => (
          <StringField name={rowName} defaultValue={item} label="Line" />
        )}
      />
      <TextField
        name={`${name}.rightsLine`}
        defaultValue={rightsLine}
        label="Rights line"
      />
    </div>
  );
}

export function JsonLdSection({
  name,
  defaultValue,
}: SectionProps<'jsonLd'>) {
  const {
    name: restaurantName,
    telephone,
    email,
    imageKey,
    menuPath,
    servesCuisine,
    priceRange,
    address,
    openingHours,
    sameAs,
    ...unhandled
  } = defaultValue;
  expectNoFields(unhandled);
  const {
    streetAddress,
    addressLocality,
    addressRegion,
    postalCode,
    addressCountry,
    ...addressUnhandled
  } = address;
  expectNoFields(addressUnhandled);
  return (
    <div className="space-y-4">
      <StringField name={`${name}.name`} defaultValue={restaurantName} label="Name" />
      <StringField name={`${name}.telephone`} defaultValue={telephone} label="Telephone" />
      <StringField name={`${name}.email`} defaultValue={email} label="Email" type="email" />
      <StringField name={`${name}.imageKey`} defaultValue={imageKey} label="Image key" />
      <StringField name={`${name}.menuPath`} defaultValue={menuPath} label="Menu path" />
      <ArrayField
        name={`${name}.servesCuisine`}
        defaultValue={servesCuisine}
        label="Serves cuisine"
        newItem={() => ''}
        renderItem={(item, rowName) => (
          <StringField name={rowName} defaultValue={item} label="Cuisine" />
        )}
      />
      <StringField name={`${name}.priceRange`} defaultValue={priceRange} label="Price range" />
      <StructField label="Address">
        <div className="grid gap-3 sm:grid-cols-2">
          <StringField
            name={`${name}.address.streetAddress`}
            defaultValue={streetAddress}
            label="Street address"
          />
          <StringField
            name={`${name}.address.addressLocality`}
            defaultValue={addressLocality}
            label="Locality"
          />
          <StringField
            name={`${name}.address.addressRegion`}
            defaultValue={addressRegion}
            label="Region"
          />
          <StringField
            name={`${name}.address.postalCode`}
            defaultValue={postalCode}
            label="Postal code"
          />
          <StringField
            name={`${name}.address.addressCountry`}
            defaultValue={addressCountry}
            label="Country"
          />
        </div>
      </StructField>
      <ArrayField
        name={`${name}.openingHours`}
        defaultValue={openingHours}
        label="Opening hours"
        newItem={() => ({ dayOfWeek: '', opens: '', closes: '' })}
        renderItem={(item, rowName) => {
          const { dayOfWeek, opens, closes, ...itemUnhandled } = item;
          expectNoFields(itemUnhandled);
          return (
            <div className="space-y-3">
              {typeof dayOfWeek === 'string' ? (
                <StringField
                  name={`${rowName}.dayOfWeek`}
                  defaultValue={dayOfWeek}
                  label="Day of week"
                />
              ) : (
                <ArrayField
                  name={`${rowName}.dayOfWeek`}
                  defaultValue={dayOfWeek}
                  label="Days of week"
                  newItem={() => ''}
                  renderItem={(day, dayName) => (
                    <StringField name={dayName} defaultValue={day} label="Day" />
                  )}
                />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <StringField name={`${rowName}.opens`} defaultValue={opens} label="Opens" />
                <StringField name={`${rowName}.closes`} defaultValue={closes} label="Closes" />
              </div>
            </div>
          );
        }}
      />
      <ArrayField
        name={`${name}.sameAs`}
        defaultValue={sameAs}
        label="Same as"
        newItem={() => ''}
        renderItem={(item, rowName) => (
          <StringField name={rowName} defaultValue={item} label="URL" type="url" />
        )}
      />
    </div>
  );
}
