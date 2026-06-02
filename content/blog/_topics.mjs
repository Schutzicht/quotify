/* ===========================================================
   Offertje - onderwerpen-wachtrij voor de auto-blogmotor.
   De motor pakt het eerste onderwerp waarvan nog geen
   content/blog/<slug>.mjs bestaat, schrijft het artikel en
   zet het als PR klaar (cron) of schrijft het lokaal (CLI).

   Voeg hier gerust nieuwe rijen toe. Velden:
   - slug      : kebab-case, wordt de URL /blog/<slug>/
   - keyword   : primaire zoekterm
   - category  : Basis | Voorbeelden | ZZP & freelance |
                 Juridisch & BTW | Verkoop & opvolging | Branche
   - angle     : korte instructie over de invalshoek/inhoud
   - related   : 3 bestaande slugs om naar te linken
   =========================================================== */

export default [
    // --- Branche: bouw & techniek ---
    { slug: 'offerte-cv-ketel', keyword: 'offerte cv-ketel vervangen', category: 'Branche', angle: 'Offerte voor cv-ketel vervangen: ketel, installatie-uren, afvoer oude ketel, inregelen. Voorbeeldtabel.', related: ['offerte-warmtepomp', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-airco', keyword: 'offerte airco', category: 'Branche', angle: 'Offerte voor airco-installatie: binnen/buitenunit, aantal, leidingwerk, montage. Voorbeeldtabel.', related: ['offerte-warmtepomp', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-isolatie', keyword: 'offerte isolatie', category: 'Branche', angle: 'Offerte voor isolatiebedrijf: spouwmuur, vloer, dak, glas. Per m2, subsidie algemeen. Voorbeeldtabel.', related: ['offerte-dakdekker', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-kozijnen', keyword: 'offerte kozijnen', category: 'Branche', angle: 'Offerte voor kunststof/houten kozijnen: per stuk, glas, montage, afwerking. Voorbeeldtabel.', related: ['offerte-verbouwing', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-dakkapel', keyword: 'offerte dakkapel', category: 'Branche', angle: 'Offerte voor dakkapel plaatsen: prefab vs bouw, breedte, plaatsing, afwerking. Voorbeeldtabel.', related: ['offerte-dakdekker', 'offerte-verbouwing', 'offerte-maken'] },
    { slug: 'offerte-badkamer-renovatie', keyword: 'offerte badkamer renovatie', category: 'Branche', angle: 'Offerte voor badkamerrenovatie: sloop, tegelwerk, sanitair, installatie. Stelposten. Voorbeeldtabel.', related: ['offerte-tegelzetter', 'offerte-loodgieter', 'offerte-verbouwing'] },
    { slug: 'offerte-keuken-plaatsen', keyword: 'offerte keuken plaatsen', category: 'Branche', angle: 'Offerte voor keukenmontage: monteur-uren, aansluiten, aanpassingen, afvoer oude keuken. Voorbeeldtabel.', related: ['offerte-timmerman', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-zonwering', keyword: 'offerte zonwering', category: 'Branche', angle: 'Offerte voor zonwering/screens/rolluiken: per stuk, motor, montage. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offertes-vergelijken'] },
    { slug: 'offerte-hekwerk', keyword: 'offerte hekwerk', category: 'Branche', angle: 'Offerte voor hekwerk/schutting: per meter, poort, fundering, montage. Voorbeeldtabel.', related: ['offerte-hovenier', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-gevelreiniging', keyword: 'offerte gevelreiniging', category: 'Branche', angle: 'Offerte voor gevelreiniging/impregneren: per m2, methode, steiger. Voorbeeldtabel.', related: ['offerte-schilder', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-betonvloer', keyword: 'offerte betonvloer', category: 'Branche', angle: 'Offerte voor gietvloer/betonvloer: per m2, voorbereiding, coating. Voorbeeldtabel.', related: ['offerte-vloerlegger', 'offerte-maken', 'offerte-voorbeeld'] },

    // --- Branche: groen & buiten ---
    { slug: 'offerte-tuinaanleg', keyword: 'offerte tuinaanleg', category: 'Branche', angle: 'Offerte voor complete tuinaanleg: ontwerp, grondwerk, bestrating, beplanting, verlichting. Voorbeeldtabel.', related: ['offerte-hovenier', 'offerte-stratenmaker', 'offerte-maken'] },
    { slug: 'offerte-veranda', keyword: 'offerte veranda', category: 'Branche', angle: 'Offerte voor veranda/overkapping: afmeting, materiaal, fundering, montage. Voorbeeldtabel.', related: ['offerte-verbouwing', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-boomverzorging', keyword: 'offerte boom snoeien', category: 'Branche', angle: 'Offerte voor boomverzorging: snoeien, kappen, stronkfrezen, afvoer, klimwerk. Voorbeeldtabel.', related: ['offerte-hovenier', 'offerte-maken', 'offerte-voorbeeld'] },

    // --- Branche: creatief & diensten ---
    { slug: 'offerte-videograaf', keyword: 'offerte videograaf', category: 'Branche', angle: 'Offerte voor videoproductie: concept, draaidag, montage, gebruiksrechten. Pakketten. Voorbeeldtabel.', related: ['offerte-fotograaf', 'offerte-maken', 'offerte-maken-als-zzper'] },
    { slug: 'offerte-grafisch-ontwerper', keyword: 'offerte grafisch ontwerp', category: 'Branche', angle: 'Offerte voor grafisch ontwerp: logo, huisstijl, drukwerk, revisies. Voorbeeldtabel.', related: ['offerte-webdesign-freelance', 'offerte-maken-als-zzper', 'offerte-maken'] },
    { slug: 'offerte-social-media-beheer', keyword: 'offerte social media beheer', category: 'Branche', angle: 'Offerte voor social media beheer: contentplan, posts per maand, advertenties, retainer. Voorbeeldtabel.', related: ['offerte-marketingbureau', 'offerte-maken', 'professionele-offerte-tips'] },
    { slug: 'offerte-webshop-laten-maken', keyword: 'offerte webshop laten maken', category: 'Branche', angle: 'Offerte voor webshop bouwen: design, platform, producten, koppelingen, onderhoud. Voorbeeldtabel.', related: ['offerte-webdesign-freelance', 'offerte-maken', 'meerwerk-en-offerte'] },
    { slug: 'offerte-fotobooth', keyword: 'offerte fotobooth huren', category: 'Branche', angle: 'Offerte voor fotobooth/partyverhuur: huurperiode, props, prints, bezorging, personeel. Voorbeeldtabel.', related: ['offerte-fotograaf', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-dj', keyword: 'offerte dj huren', category: 'Branche', angle: 'Offerte voor DJ/entertainment: uren, apparatuur, licht, reiskosten. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offerte-catering'] },
    { slug: 'offerte-vertaler', keyword: 'offerte vertaling', category: 'Branche', angle: 'Offerte voor vertaalwerk: per woord, taalcombinatie, revisie, spoed, beediging. Voorbeeldtabel.', related: ['offerte-tekstschrijver', 'offerte-maken-als-zzper', 'offerte-maken'] },
    { slug: 'offerte-administratiekantoor', keyword: 'offerte boekhouder', category: 'Branche', angle: 'Offerte voor boekhouder/administratiekantoor: maandelijks tarief, aangifte, jaarrekening. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-maken-als-zzper', 'offerte-voorbeeld'] },
    { slug: 'offerte-ict-bedrijf', keyword: 'offerte ict beheer', category: 'Branche', angle: 'Offerte voor ICT-beheer/support: setup, beheer per werkplek, SLA, retainer. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-software-vergelijken', 'offerte-voorbeeld'] },
    { slug: 'offerte-schoonheidssalon', keyword: 'offerte schoonheidsbehandeling', category: 'Branche', angle: 'Offerte/prijsopgave voor behandelpakketten in een salon: behandelingen, abonnement. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'professionele-offerte-tips'] },

    // --- Basis & proces ---
    { slug: 'offerte-aanvragen', keyword: 'offerte aanvragen', category: 'Basis', angle: 'Hoe vraag je een goede offerte aan: wat geef je door, meerdere aanvragen, voorbeeld aanvraagtekst.', related: ['offertes-vergelijken', 'offerte-maken', 'wat-moet-er-op-een-offerte-staan'] },
    { slug: 'prijsopgave-vs-offerte', keyword: 'prijsopgave of offerte', category: 'Basis', angle: 'Verschil prijsopgave, offerte, raming en begroting. Wanneer welke term, juridische lading.', related: ['offerte-maken', 'verschil-offerte-en-factuur', 'vrijblijvende-offerte-betekenis'] },
    { slug: 'kosten-offerte-laten-maken', keyword: 'wat kost een offerte', category: 'Basis', angle: 'Mag je geld vragen voor een offerte? Kosten van offreren, calculatiekosten, gratis vs betaald.', related: ['offerte-maken', 'gratis-offerte-maken', 'professionele-offerte-tips'] },
    { slug: 'offerte-onderhandelen', keyword: 'onderhandelen over offerte', category: 'Verkoop & opvolging', angle: 'Omgaan met onderhandeling en kortingsverzoeken op je offerte, zonder je marge weg te geven.', related: ['offerte-afwijzing-voorkomen', 'professionele-offerte-tips', 'offerte-maken'] },
    { slug: 'offerte-template-excel', keyword: 'offerte template excel', category: 'Basis', angle: 'Offerte in Excel maken: voor- en nadelen, formules, valkuilen, vs een generator. Sterke CTA.', related: ['offerte-template-word-of-generator', 'offerte-maken', 'gratis-offerte-maken'] },
    { slug: 'offertenummer', keyword: 'offertenummer', category: 'Basis', angle: 'Offertenummering: waarom, logische opbouw (jaar + volgnummer), administratie, naar factuurnummer.', related: ['wat-moet-er-op-een-offerte-staan', 'offerte-maken', 'verschil-offerte-en-factuur'] },

    // --- Juridisch & BTW ---
    { slug: 'offerte-zonder-btw', keyword: 'offerte zonder btw', category: 'Juridisch & BTW', angle: 'Offerte zonder btw: kleineondernemersregeling (KOR), btw-vrijgestelde diensten, hoe je dit vermeldt.', related: ['btw-op-de-offerte', 'offerte-maken-als-zzper', 'offerte-maken'] },
    { slug: 'offerte-particulier-of-zakelijk', keyword: 'offerte particulier of zakelijk', category: 'Juridisch & BTW', angle: 'Verschil offerte aan particulier vs zakelijke klant: prijzen incl of excl btw tonen, voorwaarden.', related: ['btw-op-de-offerte', 'offerte-maken', 'algemene-voorwaarden-offerte'] },
    { slug: 'offerte-nakomen-verplicht', keyword: 'is een offerte bindend', category: 'Juridisch & BTW', angle: 'Is een offerte bindend? Vrijblijvend vs onherroepelijk, fouten in de offerte, je eraan houden.', related: ['vrijblijvende-offerte-betekenis', 'hoe-lang-is-een-offerte-geldig', 'offerte-accepteren'] },

    // --- Voorbeelden ---
    { slug: 'offerte-voorbeeld-dienstverlening', keyword: 'offerte voorbeeld dienstverlening', category: 'Voorbeelden', angle: 'Uitgewerkt offerte voorbeeld voor een dienst (uurtarief + vaste posten), met uitleg per onderdeel.', related: ['offerte-voorbeeld', 'offerte-maken-als-zzper', 'offerte-maken'] },
];
