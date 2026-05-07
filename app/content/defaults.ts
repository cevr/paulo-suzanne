import { SiteContent } from './schema';

export const defaultContent: SiteContent = SiteContent.make({
  meta: {
    title: {
      en: 'Paulo & Suzanne | The Original Casse-Croûte',
      fr: "Paulo & Suzanne | L'Original Casse-Croûte",
    },
    description: {
      en: 'Poutine, burgers and sandwiches since 1980',
      fr: 'Poutine, burgers et sandwichs depuis 1980',
    },
    ogImage: {
      key: 'indoor.avif',
      alt: {
        en: 'Paulo & Suzanne restaurant interior',
        fr: 'Intérieur du restaurant Paulo & Suzanne',
      },
      width: 800,
      height: 600,
    },
  },

  header: {
    logo: {
      key: 'images/logo-small.png',
      alt: { en: 'Paulo & Suzanne', fr: 'Paulo & Suzanne' },
      width: 60,
      height: 60,
    },
    navLinks: [
      { href: '#menu', label: { en: 'Menu', fr: 'Menu' } },
      { href: '#about', label: { en: 'About', fr: 'À propos' } },
      { href: '#location', label: { en: 'Location', fr: 'Emplacement' } },
      { href: '#contact', label: { en: 'Contact', fr: 'Contact' } },
    ],
    orderOnlineUrl: 'https://order2.silverwarepos.com/app/PauloSuzanne#!/menu',
    orderLong: { en: 'Order Online', fr: 'Commander en ligne' },
    orderShort: { en: 'Order', fr: 'Commander' },
    openMenuLabel: { en: 'Open menu', fr: 'Ouvrir le menu' },
    closeMenuLabel: { en: 'Close menu', fr: 'Fermer le menu' },
  },

  hero: {
    since: { en: 'SINCE 1980', fr: 'DEPUIS 1980' },
    headline: {
      en: 'LEGENDARY POUTINE & BURGERS',
      fr: 'POUTINE & BURGERS LÉGENDAIRES',
    },
    tagline: {
      en: 'The Original Casse-Croûte',
      fr: "L'Original Casse-Croûte",
    },
    ctaPrimary: {
      href: '#menu',
      label: { en: 'View Menu', fr: 'Voir le Menu' },
    },
    ctaSecondary: {
      href: 'https://order2.silverwarepos.com/app/PauloSuzanne#!/menu',
      label: { en: 'Order Online', fr: 'Commander en ligne' },
    },
  },

  about: {
    heading: { en: 'OUR STORY', fr: 'NOTRE HISTOIRE' },
    subheading: {
      en: 'Paulo et Suzanne: Your 24-Hour Poutine Parlor',
      fr: 'Paulo et Suzanne: Votre Casse-Croûte 24 Heures',
    },
    intro: {
      en: "Born in 1980 out of friendship—and the irresistible pull of golden fries—Paulo et Suzanne has been Quebec's go-to casse-croûte for over four decades.",
      fr: "Né en 1980 d'une amitié—et de l'attrait irrésistible des frites dorées—Paulo et Suzanne est le casse-croûte incontournable de Québec depuis plus de quatre décennies.",
    },
    storyHeading: { en: 'How we started', fr: 'Comment nous avons commencé' },
    storyBullets: [
      {
        en: 'March 18, 1980: Three friends—Suzanne, Andrie and Jocelyn—opened our doors across from Sacré-Coeur Hospital.',
        fr: "18 mars 1980 : Trois amis—Suzanne, Andrie et Jocelyn—ont ouvert nos portes en face de l'Hôpital Sacré-Cœur.",
      },
      {
        en: 'October 2003: Suzanne handed the reins to Manon and Angelo, passing the torch to a new generation! Angelo, a passionate restaurateur with years of experience, saw immense potential in this little gem. Having opened several establishments over the years and always seeking fresh inspiration through his travels, he was ready to take the restaurant to exciting new heights.',
        fr: "Octobre 2003 : Suzanne a passé le flambeau à Manon et Angelo, transmettant l'héritage à une nouvelle génération ! Angelo, passionné de restauration et restaurateur chevronné, voyait un immense potentiel dans ce petit bijou. Ayant ouvert plusieurs établissements au fil des ans et toujours en quête d'idées nouvelles à travers ses voyages, il était prêt à porter le restaurant vers de nouveaux sommets.",
      },
      {
        en: '2007: Manon and Angelo’s daughter, Alexia, jumped in at age 15 as our rookie bus girl—scrubbing tables, perfecting gravy ratios and soaking up every ounce of poutine wisdom.',
        fr: '2007 : À 15 ans, Alexia, la fille de Manon et Angelo, a débarqué comme aide-serveuse débutante—elle lavait les tables, maîtrisait déjà le bon ratio de sauce brune et emmagasinait chaque parcelle de sagesse poutinienne.',
      },
      {
        en: '2019: Diploma in hand and a lifetime of cheesy memories, Alexia officially took the helm—ushering in our third generation of flavour masters (and still hands-on with every fry!).',
        fr: '2019 : Diplôme en poche et riche d’une vie entière de souvenirs bien fromagés, Alexia a officiellement pris les rênes—inaugurant la troisième génération de maîtres de la saveur (et continuant de mettre la main à la pâte… ou à la frite !).',
      },
    ],
    valuesHeading: { en: 'What makes us tick', fr: 'Ce qui nous anime' },
    valueBullets: [
      {
        en: 'Fun & Fast-Paced: A high-energy vibe, 24/7.',
        fr: 'Amusant et Rapide: Une ambiance énergique, 24/7.',
      },
      {
        en: 'Friendly Faces: Attentive staff who know your order by heart.',
        fr: 'Visages Amicaux: Un personnel attentif qui connaît votre commande par cœur.',
      },
      {
        en: 'Fresh & Flavorful: Only top-quality ingredients go into every poutine.',
        fr: 'Frais et Savoureux: Seuls des ingrédients de première qualité entrent dans chaque poutine.',
      },
      {
        en: 'Spotless Space: We keep our restaurant as clean as our reputation.',
        fr: 'Espace Impeccable: Nous gardons notre restaurant aussi propre que notre réputation.',
      },
    ],
    promiseHeading: { en: 'Our promise', fr: 'Notre promesse' },
    promise: {
      en: "If you're not thrilled with your meal, let us know—we'll fix it on the spot or refund your money. Because excellence isn't just a goal; it's our commitment to you.",
      fr: "Si vous n'êtes pas satisfait de votre repas, faites-le nous savoir—nous le corrigerons sur place ou vous rembourserons. Parce que l'excellence n'est pas seulement un objectif; c'est notre engagement envers vous.",
    },
    since: { en: 'SINCE 1980', fr: 'DEPUIS 1980' },
    image: {
      key: 'indoor.avif',
      alt: {
        en: 'Paulo & Suzanne restaurant interior',
        fr: 'Intérieur du restaurant Paulo & Suzanne',
      },
      width: 500,
      height: 500,
    },
  },

  menu: {
    heading: { en: 'OUR MENU', fr: 'NOTRE MENU' },
    intro: {
      en: "Serving Quebec's favorite comfort food since 1980",
      fr: 'Servant la cuisine réconfortante préférée du Québec depuis 1980',
    },
    carousel: [
      {
        image: {
          key: 'images/food/poutine-pop-n-hot.avif',
          alt: { en: "Poutine Pop'n'Hot", fr: "Poutine Pop'n'Hot" },
          width: 800,
          height: 800,
        },
        description: {
          en: "Our Pop'n'Hot Poutine with popcorn chicken, bacon, hot peppers and southwest sauce",
          fr: "Notre Poutine Pop'n'Hot avec poulet popcorn, bacon, piments forts et sauce sud-ouest",
        },
      },
      {
        image: {
          key: 'images/food/poutine-extra-cheese.avif',
          alt: { en: 'Classic Poutine', fr: 'Poutine Classique' },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Our classic poutine with fries, extra cheese curds, and gravy',
          fr: 'Notre poutine classique avec frites, fromage en grains extra et sauce brune',
        },
      },
      {
        image: {
          key: 'images/food/grilled-chicken-burger-piri-piri.avif',
          alt: {
            en: 'Grilled Chicken Burger Piri Piri',
            fr: 'Burger Poulet grillé Piri Piri ',
          },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Our Grilled Chicken Burger Piri Piri with grilled chicken, piri piri sauce, lettuce, tomatoes and cheese',
          fr: 'Notre burger poulet grillé Piri Piri avec poulet grillé, sauce piri piri, laitue, tomates et fromage',
        },
      },
      {
        image: {
          key: 'images/food/southwest-club-grilled-chicken.avif',
          alt: {
            en: 'Southwest Club Grilled Chicken',
            fr: 'Club Sud-Ouest Poulet Grillé',
          },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Our Southwest Club Grilled Chicken with bacon, lettuce, tomatoes, swiss cheese and our homemade spicy southwest mayo sauce',
          fr: 'Notre Club sud-ouest poulet grillé avec bacon, laitue, tomates, fromage suisse et notre sauce mayo épicée fait maison sud ouest',
        },
      },
      {
        image: {
          key: 'images/food/grilled-cheese-smoked-meat.avif',
          alt: {
            en: 'Grilled Cheese Smoked Meat',
            fr: 'Grilled Cheese Smoked Meat',
          },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Our Grilled Cheese Smoked Meat with smoked meat, swiss cheese, and mustard',
          fr: 'Notre Grilled Cheese Smoked Meat avec viande fumée, fromage suisse et moutarde',
        },
      },
      {
        image: {
          key: 'images/food/veggie-burger.avif',
          alt: { en: 'Veggie Burger', fr: 'Burger Végétarien' },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Homemade with pico de gallo, lettuce, and guacamole - and an amazing chickpea gallete',
          fr: 'Fait maison avec pico de gallo, laitue et guacamole - et une galette de pois chiche incroyable',
        },
      },
      {
        image: {
          key: 'images/food/famous-crepes.avif',
          alt: { en: 'Crepe Supreme', fr: 'Crêpe Suprême' },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Our famous crepe with strawberries, banana, nutella and our custard cream',
          fr: 'Notre fameuse crêpe avec fraises, banane, nutella et notre crème anglaise',
        },
      },
      {
        image: {
          key: 'images/food/omelette-compagnarde.avif',
          alt: { en: 'Omelette Compagnarde', fr: 'Omelette Compagnarde' },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Our Compagnarde Omelette with 3 eggs, sausages, bacon, ham, potatoes and cheese',
          fr: 'Notre omelette compagnarde avec 3 œufs, saucisses, bacons, jambons, patates et fromage',
        },
      },
      {
        image: {
          key: 'images/food/homemade-meat-sauce.avif',
          alt: {
            en: 'Homemade Meat Sauce',
            fr: 'Sauce Viande Fait Maison',
          },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Our Homemade Meat Sauce since 1980',
          fr: 'Notre sauce viande fait maison depuis 1980',
        },
      },
      {
        image: {
          key: 'images/food/swag.avif',
          alt: { en: 'Swag', fr: 'Swag' },
          width: 800,
          height: 800,
        },
        description: {
          en: 'Get our exclusive merch and support our local business',
          fr: 'Obtenez notre merch exclusive et soutenez notre entreprise locale',
        },
      },
    ],
    pdfHeading: { en: 'View Our Menu', fr: 'Voir Notre Menu' },
    pdfBody: {
      en: 'View our complete menu with all our delicious poutines, burgers, and sandwiches.',
      fr: 'Consultez notre menu complet avec toutes nos délicieuses poutines, burgers et sandwichs.',
    },
    pdfCta: { en: 'View Menu', fr: 'Voir le Menu' },
    pdfHref: '/menu.pdf',
    disclaimer: {
      en: '* Menu prices and items subject to change without notice.',
      fr: '* Les prix et les articles du menu peuvent changer sans préavis.',
    },
  },

  location: {
    heading: { en: 'FIND US', fr: 'NOUS TROUVER' },
    mapEmbedSrc:
      'https://www.google.com/maps/embed/v1/place?q=5501+Boul+Gouin+O,+Montréal,+QC+H4J+1C8,+Canada&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8',
    mapTitle: {
      en: 'Paulo & Suzanne location map',
      fr: "Carte de l'emplacement de Paulo & Suzanne",
    },
    addressHeading: { en: 'Address', fr: 'Adresse' },
    addressLines: ['5501 Boul Gouin O', 'Montréal, QC H4J 1C8', 'Canada'],
    hoursHeading: { en: 'Hours', fr: "Heures d'ouverture" },
    hours: [
      { day: { en: 'Monday', fr: 'Lundi' }, hours: { en: '10am to 3am', fr: '10h à 3h' } },
      { day: { en: 'Tuesday', fr: 'Mardi' }, hours: { en: '10am to 3am', fr: '10h à 3h' } },
      {
        day: { en: 'Wednesday', fr: 'Mercredi' },
        hours: { en: '10am to 3am', fr: '10h à 3h' },
      },
      {
        day: { en: 'Thursday', fr: 'Jeudi' },
        hours: { en: '10am to 3am', fr: '10h à 3h' },
      },
      {
        day: { en: 'Friday', fr: 'Vendredi' },
        hours: {
          en: 'Opens at 10am (stays open overnight)',
          fr: 'Ouvre à 10h (reste ouvert toute la nuit)',
        },
      },
      {
        day: { en: 'Saturday', fr: 'Samedi' },
        hours: { en: 'Open 24 hours', fr: 'Ouvert 24 heures' },
      },
      {
        day: { en: 'Sunday', fr: 'Dimanche' },
        hours: { en: 'Open until 3am Monday', fr: "Ouvert jusqu'à 3h lundi" },
      },
    ],
  },

  contact: {
    heading: { en: 'CONTACT US', fr: 'CONTACTEZ-NOUS' },
    formHeading: { en: 'Get in Touch', fr: 'Entrez en Contact' },
    phoneLabel: { en: 'Phone', fr: 'Téléphone' },
    phoneDisplay: '(514) 336-5561',
    phoneTel: '+15143365561',
    emailLabel: { en: 'Email', fr: 'Courriel' },
    emailAddress: 'info@pauloetsuzanne.com',
    followLabel: { en: 'Follow Us', fr: 'Suivez-nous' },
    socials: [
      {
        kind: 'instagram',
        href: 'https://www.instagram.com/pauloetsuzanne_officiel/',
        ariaLabel: {
          en: 'Follow us on Instagram',
          fr: 'Suivez-nous sur Instagram',
        },
      },
      {
        kind: 'facebook',
        href: 'https://www.facebook.com/pauloetsuzanne247/',
        ariaLabel: {
          en: 'Follow us on Facebook',
          fr: 'Suivez-nous sur Facebook',
        },
      },
    ],
  },

  footer: {
    logo: {
      key: 'images/logo-small.png',
      alt: { en: 'Paulo & Suzanne', fr: 'Paulo & Suzanne' },
      width: 150,
      height: 75,
    },
    tagline: {
      en: "Serving Quebec's favorite comfort food since 1980",
      fr: 'Servant la cuisine réconfortante préférée du Québec depuis 1980',
    },
    quickLinksHeading: { en: 'Quick Links', fr: 'Liens Rapides' },
    quickLinks: [
      { href: '#menu', label: { en: 'Menu', fr: 'Menu' } },
      { href: '#about', label: { en: 'About', fr: 'À propos' } },
      { href: '#location', label: { en: 'Location', fr: 'Emplacement' } },
      { href: '#contact', label: { en: 'Contact', fr: 'Contact' } },
    ],
    contactInfoHeading: { en: 'Contact Info', fr: 'Coordonnées' },
    contactInfoLines: ['5501 Boul Gouin O', 'Montréal, QC H4J 1C8', 'Canada'],
    hoursHeading: { en: 'Hours', fr: "Heures d'ouverture" },
    hoursSummary: {
      en: 'Weekdays 10am-3am, Weekends 24/7',
      fr: 'En semaine 10h-3h, Fins de semaine 24/7',
    },
    rightsLine: { en: 'All rights reserved.', fr: 'Tous droits réservés.' },
  },

  jsonLd: {
    name: 'Paulo & Suzanne',
    telephone: '+1-514-336-5561',
    email: 'info@pauloetsuzanne.com',
    imageKey: 'indoor.avif',
    menuPath: '/menu.pdf',
    servesCuisine: ['Poutine', 'Burgers', 'Québécoise'],
    priceRange: '$$',
    address: {
      streetAddress: '5501 Boul Gouin O',
      addressLocality: 'Montréal',
      addressRegion: 'QC',
      postalCode: 'H4J 1C8',
      addressCountry: 'CA',
    },
    openingHours: [
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '10:00',
        closes: '03:00',
      },
      { dayOfWeek: 'Friday', opens: '10:00', closes: '23:59' },
      { dayOfWeek: 'Saturday', opens: '00:00', closes: '23:59' },
      { dayOfWeek: 'Sunday', opens: '00:00', closes: '03:00' },
    ],
    sameAs: [
      'https://www.instagram.com/pauloetsuzanne_officiel/',
      'https://www.facebook.com/pauloetsuzanne247/',
    ],
  },
});
