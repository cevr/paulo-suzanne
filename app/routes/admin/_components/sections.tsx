import { useState, type ReactNode } from 'react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import type { EditorAsset } from '~/content/editor';
import type { ImageRef, SiteContent, SocialKind, Text } from '~/content/schema';
import { MENU_PDF_PUBLIC_HREF } from '~/lib/managed-assets';

import { ImageRefField } from './asset-picker';
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
  readonly assets: readonly EditorAsset[];
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

function LockedAssetGroup({ children }: { readonly children: ReactNode }) {
  return (
    <StructField label="Managed website files">
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </StructField>
  );
}

function LockedAssetItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-neutral-700">
        {label}
      </span>
      <span className="block rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-700">
        {value}
      </span>
    </div>
  );
}

const LockedAsset = {
  Group: LockedAssetGroup,
  Item: LockedAssetItem,
};

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
      <StringField
        name={`${name}.href`}
        defaultValue={href}
        label="Link destination"
      />
      <TextField
        name={`${name}.label`}
        defaultValue={label}
        label="Link text"
      />
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
    <StructField label="Button">
      <StringField
        name={`${name}.href`}
        defaultValue={href}
        label="Link destination"
      />
      <TextField
        name={`${name}.label`}
        defaultValue={label}
        label="Link text"
      />
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

function MenuPdfUploadField({ storedHref }: { readonly storedHref: string }) {
  const [picked, setPicked] = useState<File | null>(null);
  const publicHref = MENU_PDF_PUBLIC_HREF;

  return (
    <StructField label="Menu PDF">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          title={`Stored path is locked to ${storedHref}`}
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
        label="Social sharing image"
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
      <ImageRefField
        name={`${name}.logo`}
        defaultValue={logo}
        label="Logo"
        assets={assets}
      />
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
        label="Online ordering link"
        type="url"
      />
      <TextField
        name={`${name}.orderLong`}
        defaultValue={orderLong}
        label="Order button text"
      />
      <TextField
        name={`${name}.orderShort`}
        defaultValue={orderShort}
        label="Short order button text"
      />
      <TextField
        name={`${name}.openMenuLabel`}
        defaultValue={openMenuLabel}
        label="Open mobile menu text"
      />
      <TextField
        name={`${name}.closeMenuLabel`}
        defaultValue={closeMenuLabel}
        label="Close mobile menu text"
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
      <TextField
        name={`${name}.headline`}
        defaultValue={headline}
        label="Headline"
      />
      <TextField
        name={`${name}.tagline`}
        defaultValue={tagline}
        label="Tagline"
      />
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
      <TextField
        name={`${name}.heading`}
        defaultValue={heading}
        label="Heading"
      />
      <TextField
        name={`${name}.subheading`}
        defaultValue={subheading}
        label="Subheading"
      />
      <TextField
        name={`${name}.intro`}
        defaultValue={intro}
        label="Intro"
        multiline
      />
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
          <TextField
            name={rowName}
            defaultValue={item}
            label="Bullet"
            multiline
          />
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
          <TextField
            name={rowName}
            defaultValue={item}
            label="Bullet"
            multiline
          />
        )}
      />
      <TextField
        name={`${name}.promiseHeading`}
        defaultValue={promiseHeading}
        label="Promise heading"
      />
      <TextField
        name={`${name}.promise`}
        defaultValue={promise}
        label="Promise"
        multiline
      />
      <TextField name={`${name}.since`} defaultValue={since} label="Since" />
      <ImageRefField
        name={`${name}.image`}
        defaultValue={image}
        label="Image"
        assets={assets}
      />
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
      <TextField
        name={`${name}.heading`}
        defaultValue={heading}
        label="Heading"
      />
      <TextField
        name={`${name}.intro`}
        defaultValue={intro}
        label="Intro"
        multiline
      />
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

export function MenuPdfSection({ name, defaultValue }: SectionProps<'menu'>) {
  const { pdfHeading, pdfBody, pdfCta, pdfHref, disclaimer } = defaultValue;
  return (
    <div className="space-y-4">
      <TextField
        name={`${name}.pdfHeading`}
        defaultValue={pdfHeading}
        label="PDF heading"
      />
      <TextField
        name={`${name}.pdfBody`}
        defaultValue={pdfBody}
        label="PDF description"
        multiline
      />
      <TextField
        name={`${name}.pdfCta`}
        defaultValue={pdfCta}
        label="Download button text"
      />
      <MenuPdfUploadField storedHref={pdfHref} />
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
      <TextField
        name={`${name}.heading`}
        defaultValue={heading}
        label="Heading"
      />
      <StringField
        name={`${name}.mapEmbedSrc`}
        defaultValue={mapEmbedSrc}
        label="Google Maps embed link"
        type="url"
      />
      <TextField
        name={`${name}.mapTitle`}
        defaultValue={mapTitle}
        label="Map accessibility title"
      />
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
      <TextField
        name={`${name}.heading`}
        defaultValue={heading}
        label="Heading"
      />
      <TextField
        name={`${name}.formHeading`}
        defaultValue={formHeading}
        label="Form heading"
      />
      <TextField
        name={`${name}.phoneLabel`}
        defaultValue={phoneLabel}
        label="Phone heading"
      />
      <StringField
        name={`${name}.phoneDisplay`}
        defaultValue={phoneDisplay}
        label="Displayed phone number"
        type="tel"
      />
      <StringField
        name={`${name}.phoneTel`}
        defaultValue={phoneTel}
        label="Click-to-call number"
      />
      <TextField
        name={`${name}.emailLabel`}
        defaultValue={emailLabel}
        label="Email heading"
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
        label="Social links heading"
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
                label="Social network"
                options={socialOptions}
              />
              <StringField
                name={`${rowName}.href`}
                defaultValue={href}
                label="Profile link"
                type="url"
              />
              <TextField
                name={`${rowName}.ariaLabel`}
                defaultValue={ariaLabel}
                label="Accessible link name"
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
      <ImageRefField
        name={`${name}.logo`}
        defaultValue={logo}
        label="Logo"
        assets={assets}
      />
      <TextField
        name={`${name}.tagline`}
        defaultValue={tagline}
        label="Tagline"
      />
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

export function JsonLdSection({ name, defaultValue }: SectionProps<'jsonLd'>) {
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
      <StringField
        name={`${name}.name`}
        defaultValue={restaurantName}
        label="Restaurant name"
      />
      <StringField
        name={`${name}.telephone`}
        defaultValue={telephone}
        label="Phone number"
      />
      <StringField
        name={`${name}.email`}
        defaultValue={email}
        label="Email"
        type="email"
      />
      <LockedAsset.Group>
        <LockedAsset.Item label="Image file" value={imageKey} />
        <LockedAsset.Item label="Menu file" value={menuPath} />
      </LockedAsset.Group>
      <ArrayField
        name={`${name}.servesCuisine`}
        defaultValue={servesCuisine}
        label="Cuisine types"
        newItem={() => ''}
        renderItem={(item, rowName) => (
          <StringField name={rowName} defaultValue={item} label="Cuisine" />
        )}
      />
      <StringField
        name={`${name}.priceRange`}
        defaultValue={priceRange}
        label="Price range"
      />
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
            label="City"
          />
          <StringField
            name={`${name}.address.addressRegion`}
            defaultValue={addressRegion}
            label="Province or state"
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
                    <StringField
                      name={dayName}
                      defaultValue={day}
                      label="Day"
                    />
                  )}
                />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <StringField
                  name={`${rowName}.opens`}
                  defaultValue={opens}
                  label="Opening time"
                />
                <StringField
                  name={`${rowName}.closes`}
                  defaultValue={closes}
                  label="Closing time"
                />
              </div>
            </div>
          );
        }}
      />
      <ArrayField
        name={`${name}.sameAs`}
        defaultValue={sameAs}
        label="Other profile links"
        newItem={() => ''}
        renderItem={(item, rowName) => (
          <StringField
            name={rowName}
            defaultValue={item}
            label="Profile link"
            type="url"
          />
        )}
      />
    </div>
  );
}
