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

    // --- Extra branche-backlog ---
    { slug: 'offerte-voeger', keyword: 'offerte voegwerk', category: 'Branche', angle: 'Offerte voegwerk: u/knipvoeg, uithakken, per m2, steiger. Voorbeeldtabel.', related: ['offerte-metselaar', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-sloopwerk', keyword: 'offerte sloopwerk', category: 'Branche', angle: 'Offerte sloopwerk: per m2/m3, asbest (algemeen), afvoer, container. Voorbeeldtabel.', related: ['offerte-verbouwing', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-grondwerk', keyword: 'offerte grondwerk', category: 'Branche', angle: 'Offerte grondwerk: uitgraven, afvoer grond, machinewerk, per m3. Voorbeeldtabel.', related: ['offerte-stratenmaker', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-vijver', keyword: 'offerte vijver aanleggen', category: 'Branche', angle: 'Offerte vijveraanleg: graven, folie, pomp/filter, beplanting. Voorbeeldtabel.', related: ['offerte-hovenier', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-kunstgras', keyword: 'offerte kunstgras', category: 'Branche', angle: 'Offerte kunstgras: per m2, ondergrond, leggen, afwerking. Voorbeeldtabel.', related: ['offerte-hovenier', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-carport', keyword: 'offerte carport', category: 'Branche', angle: 'Offerte carport: hout/staal, fundering, dakbedekking, montage. Voorbeeldtabel.', related: ['offerte-verbouwing', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-tuinhuis', keyword: 'offerte tuinhuis', category: 'Branche', angle: 'Offerte tuinhuis/blokhut: bouwpakket vs op maat, fundering, plaatsing. Voorbeeldtabel.', related: ['offerte-hovenier', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-pergola', keyword: 'offerte pergola', category: 'Branche', angle: 'Offerte pergola/overkapping: materiaal, fundering, montage. Voorbeeldtabel.', related: ['offerte-verbouwing', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-vlonder', keyword: 'offerte vlonder', category: 'Branche', angle: 'Offerte vlonder/terras hout-composiet: per m2, onderconstructie, montage. Voorbeeldtabel.', related: ['offerte-hovenier', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-poort', keyword: 'offerte poort', category: 'Branche', angle: 'Offerte poort/inrijhek: materiaal, automatisering, montage. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offertes-vergelijken'] },
    { slug: 'offerte-dakraam', keyword: 'offerte dakraam', category: 'Branche', angle: 'Offerte dakraam plaatsen: raam, inbouw, afwerking binnen. Voorbeeldtabel.', related: ['offerte-dakdekker', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-gordijnen', keyword: 'offerte gordijnen op maat', category: 'Branche', angle: 'Offerte raamdecoratie: gordijnen/jaloezieen op maat, per raam, montage. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offertes-vergelijken'] },
    { slug: 'offerte-behanger', keyword: 'offerte behangen', category: 'Branche', angle: 'Offerte behangwerk: per rol/m2, voorbehandeling, materiaal. Voorbeeldtabel.', related: ['offerte-schilder', 'offerte-stukadoor', 'offerte-maken'] },
    { slug: 'offerte-cv-onderhoud', keyword: 'offerte cv onderhoud', category: 'Branche', angle: 'Offerte cv-onderhoud/servicecontract: beurt, abonnement, storingsdienst. Voorbeeldtabel.', related: ['offerte-cv-ketel', 'offerte-installatiebedrijf', 'offerte-maken'] },
    { slug: 'offerte-ongediertebestrijding', keyword: 'offerte ongediertebestrijding', category: 'Branche', angle: 'Offerte ongediertebestrijding: inspectie, behandeling, nazorg, contract. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offertes-vergelijken'] },
    { slug: 'offerte-glazenwasser', keyword: 'offerte glazenwasser', category: 'Branche', angle: 'Offerte glasbewassing: per beurt of abonnement, binnen/buiten, hoogwerker. Voorbeeldtabel.', related: ['offerte-schoonmaakbedrijf', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-vloerisolatie', keyword: 'offerte vloerisolatie', category: 'Branche', angle: 'Offerte vloer/bodemisolatie: per m2, methode, kruipruimte, subsidie algemeen. Voorbeeldtabel.', related: ['offerte-spouwmuurisolatie', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-funderingsherstel', keyword: 'offerte funderingsherstel', category: 'Branche', angle: 'Offerte funderingsherstel: onderzoek, methode, per strekkende meter. Voorbeeldtabel.', related: ['offerte-verbouwing', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-houten-kozijnen', keyword: 'offerte houten kozijnen', category: 'Branche', angle: 'Offerte houten kozijnen: per stuk, glas, schilderwerk, montage. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offertes-vergelijken'] },
    { slug: 'offerte-serre', keyword: 'offerte serre', category: 'Branche', angle: 'Offerte serre/uitbouw met glas: fundering, constructie, beglazing. Voorbeeldtabel.', related: ['offerte-verbouwing', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-bedrijfsfilm', keyword: 'offerte bedrijfsfilm', category: 'Branche', angle: 'Offerte bedrijfsvideo: concept, draaidagen, montage, gebruiksrecht. Voorbeeldtabel.', related: ['offerte-fotograaf', 'offerte-marketingbureau', 'offerte-maken'] },
    { slug: 'offerte-dronefotografie', keyword: 'offerte drone opnames', category: 'Branche', angle: 'Offerte drone-opnames: vlucht, bewerking, vergunning, levering. Voorbeeldtabel.', related: ['offerte-fotograaf', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-logo-ontwerp', keyword: 'offerte logo laten maken', category: 'Branche', angle: 'Offerte logo-ontwerp: concepten, revisies, huisstijl, bestandsformaten. Voorbeeldtabel.', related: ['offerte-grafisch-ontwerper', 'offerte-marketingbureau', 'offerte-maken'] },
    { slug: 'offerte-drukwerk', keyword: 'offerte drukwerk', category: 'Branche', angle: 'Offerte drukwerk: oplage, formaat, papier, afwerking, opmaak. Voorbeeldtabel.', related: ['offerte-grafisch-ontwerper', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-belettering', keyword: 'offerte autobelettering', category: 'Branche', angle: 'Offerte belettering/signing: ontwerp, materiaal per m2, montage. Voorbeeldtabel.', related: ['offerte-grafisch-ontwerper', 'offerte-maken', 'offerte-voorbeeld'] },
    { slug: 'offerte-personal-trainer', keyword: 'offerte personal training', category: 'Branche', angle: 'Offerte personal training: intake, trajecten, losse sessies, online. Voorbeeldtabel.', related: ['offerte-trainer-coach', 'offerte-maken-als-zzper', 'offerte-maken'] },
    { slug: 'offerte-boekhouder', keyword: 'offerte boekhouder zzp', category: 'Branche', angle: 'Offerte boekhouding zzp: maandtarief, aangiftes, jaarrekening, advies. Voorbeeldtabel.', related: ['offerte-administratiekantoor', 'offerte-maken-als-zzper', 'offerte-maken'] },
    { slug: 'offerte-bouwkundige-keuring', keyword: 'offerte bouwkundige keuring', category: 'Branche', angle: 'Offerte bouwkundige keuring: inspectie, rapport, NEN2767, meerwerk. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offertes-vergelijken'] },
    { slug: 'offerte-energielabel', keyword: 'offerte energielabel', category: 'Branche', angle: 'Offerte energielabel woning: opname, registratie, advies. Voorbeeldtabel.', related: ['offerte-maken', 'offerte-voorbeeld', 'offertes-vergelijken'] },

    // --- Extra kosten-backlog ---
    { slug: 'wat-kost-een-schutting', keyword: 'wat kost een schutting', category: 'Kosten', angle: 'Kostengids schutting/hekwerk: per meter, materiaal, fundering, plaatsing. Tabel.', related: ['offerte-hekwerk', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-een-veranda', keyword: 'wat kost een veranda', category: 'Kosten', angle: 'Kostengids veranda/overkapping: per m2, materiaal, fundering, glas. Tabel.', related: ['offerte-veranda', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-een-nieuwe-vloer', keyword: 'wat kost een nieuwe vloer', category: 'Kosten', angle: 'Kostengids vloer: pvc/laminaat/parket per m2, egaliseren, leggen. Tabel.', related: ['offerte-vloerlegger', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-een-fotograaf', keyword: 'wat kost een fotograaf', category: 'Kosten', angle: 'Kostengids fotograaf: per uur/dagdeel, type shoot, nabewerking, gebruiksrecht. Tabel.', related: ['offerte-fotograaf', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-een-logo', keyword: 'wat kost een logo', category: 'Kosten', angle: 'Kostengids logo: freelancer vs bureau, concepten, huisstijl. Tabel.', related: ['offerte-logo-ontwerp', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-een-webshop', keyword: 'wat kost een webshop', category: 'Kosten', angle: 'Kostengids webshop: platform, aantal producten, koppelingen, onderhoud. Tabel.', related: ['offerte-webshop-laten-maken', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-een-airco', keyword: 'wat kost een airco', category: 'Kosten', angle: 'Kostengids airco: per unit, single/multi-split, installatie. Tabel.', related: ['offerte-airco', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-een-laadpaal', keyword: 'wat kost een laadpaal', category: 'Kosten', angle: 'Kostengids laadpaal: paal, installatie, kabel, slim laden, subsidie algemeen. Tabel.', related: ['offerte-laadpaal', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-vloerverwarming', keyword: 'wat kost vloerverwarming', category: 'Kosten', angle: 'Kostengids vloerverwarming: infrezen vs nieuwe vloer, per m2, verdeler. Tabel.', related: ['offerte-vloerverwarming', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'wat-kost-tegelzetten', keyword: 'wat kost tegelzetten per m2', category: 'Kosten', angle: 'Kostengids tegelzetten: per m2 vloer/wand, voegen, egaliseren. Tabel.', related: ['offerte-tegelzetter', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'uurtarief-loodgieter', keyword: 'uurtarief loodgieter', category: 'Kosten', angle: 'Wat verdient/kost een loodgieter per uur: tarief, voorrijkosten, spoed. Tabel.', related: ['offerte-loodgieter', 'wat-kost-een-cv-ketel', 'offerte-maken'] },
    { slug: 'uurtarief-elektricien', keyword: 'uurtarief elektricien', category: 'Kosten', angle: 'Uurtarief elektricien: tarief, voorrijkosten, materiaal apart. Tabel.', related: ['offerte-elektricien', 'offertes-vergelijken', 'offerte-maken'] },
    { slug: 'uurtarief-hovenier', keyword: 'uurtarief hovenier', category: 'Kosten', angle: 'Uurtarief hovenier: tarief, ploeg, machines, voorrijden. Tabel.', related: ['offerte-hovenier', 'wat-kost-een-hovenier', 'offerte-maken'] },
    { slug: 'uurtarief-schilder', keyword: 'uurtarief schilder', category: 'Kosten', angle: 'Uurtarief schilder: tarief, materiaal, 9% btw arbeid woning. Tabel.', related: ['offerte-schilder', 'wat-kost-schilderwerk', 'offerte-maken'] },

    // --- Extra proces-backlog ---
    { slug: 'offerte-garantie', keyword: 'garantie in offerte', category: 'Juridisch & BTW', angle: 'Garantie in een offerte: garantietermijn, wat valt eronder, vastleggen.', related: ['algemene-voorwaarden-offerte', 'offerte-maken', 'wat-moet-er-op-een-offerte-staan'] },
    { slug: 'offerte-leveringsvoorwaarden', keyword: 'leveringsvoorwaarden offerte', category: 'Juridisch & BTW', angle: 'Leverings- en betalingsvoorwaarden in de offerte benoemen en van toepassing verklaren.', related: ['algemene-voorwaarden-offerte', 'offerte-maken', 'termijnbetaling-offerte'] },
    { slug: 'offerte-annuleren', keyword: 'offerte annuleren', category: 'Juridisch & BTW', angle: 'Offerte of opdracht annuleren: voor en na akkoord, annuleringskosten, bedenktijd.', related: ['offerte-accepteren', 'vrijblijvende-offerte-betekenis', 'offerte-maken'] },
    { slug: 'hoeveel-offertes-aanvragen', keyword: 'hoeveel offertes aanvragen', category: 'Basis', angle: 'Hoeveel offertes vraag je aan om goed te vergelijken zonder eindeloos te wachten.', related: ['offertes-vergelijken', 'offerte-aanvragen', 'offerte-maken'] },
    { slug: 'offerte-prijs-verhogen', keyword: 'prijzen verhogen offerte', category: 'Verkoop & opvolging', angle: 'Tarieven of prijzen verhogen: hoe je dit communiceert in offertes, indexering.', related: ['professionele-offerte-tips', 'uurtarief-berekenen-zzp', 'offerte-maken'] },
    { slug: 'offerte-opmaak-tips', keyword: 'offerte opmaak', category: 'Basis', angle: 'Opmaak van een offerte die scoort: structuur, huisstijl, leesbaarheid, PDF.', related: ['professionele-offerte-tips', 'offerte-voorbeeld', 'offerte-maken'] },
];
