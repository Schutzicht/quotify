export default {
    slug: 'offerte-template-excel',
    title: 'Offerte template in Excel maken: zo werkt het (met valkuilen)',
    metaTitle: 'Offerte template Excel maken | Offertje',
    metaDescription:
        'Een offerte template in Excel maken? Lees hoe je formules voor subtotaal, BTW en totaal opzet, welke valkuilen je vermijdt en wanneer een generator slimmer is.',
    category: 'Basis',
    keyword: 'offerte template excel',
    date: '2026-03-12',
    updated: '2026-06-02',
    readingTime: 9,
    excerpt:
        'Een offerte template in Excel is gratis en rekent met formules mee, maar verschuift snel en is foutgevoelig. Lees hoe je het opzet en wanneer een generator beter past.',
    bodyHtml: `
<p>Een offerte template in Excel maak je door een tabel op te zetten met kolommen voor omschrijving, aantal, prijs per stuk, BTW-tarief en regeltotaal, en daar formules aan te koppelen die het subtotaal, de BTW en het totaal automatisch berekenen. Excel rekent dus mee, wat een groot voordeel is boven Word, maar de opmaak verschuift bij elke aanpassing en één verkeerde cel maakt je hele totaal onbetrouwbaar. In dit artikel laten we stap voor stap zien hoe je zo'n template opbouwt, welke formules je gebruikt, welke valkuilen je moet kennen en wanneer een online generator je beter af helpt.</p>

<div class="key-takeaways">
  <strong>In het kort</strong>
  <ul>
    <li>Een offerte template in Excel is gratis en rekent met formules subtotaal, BTW en totaal automatisch uit.</li>
    <li>De grootste valkuilen zijn verschuivende opmaak, formules die niet meegroeien met nieuwe regels en handmatige fouten in cellen.</li>
    <li>Splits BTW altijd per tarief uit, want 21%, 9% en 0% kunnen in één offerte voorkomen.</li>
    <li>Voor een enkele offerte per jaar werkt Excel prima, voor regelmatig offreren is een generator sneller, netter en foutloos.</li>
    <li>Exporteer altijd als PDF, zodat de klant geen cellen kan aanpassen en de opmaak vastligt.</li>
  </ul>
</div>

<h2 id="waarom-excel">Waarom kiezen ondernemers voor een offerte in Excel?</h2>
<p>Excel staat bij de meeste ondernemers al op de computer en kost dus niets extra. De grote reden om juist Excel te kiezen en niet Word is rekenkracht: je kunt formules invoeren die het subtotaal, de BTW en het totaal automatisch uitrekenen. Verander je een aantal of een prijs, dan past het totaal zich vanzelf aan. Dat scheelt het narekenen met de hand, wat in Word juist de grootste bron van fouten is.</p>
<p>Toch is Excel geen offertesoftware. Het is een rekenprogramma waar je een offerte in vormgeeft, en dat verschil merk je zodra je het wat vaker doet. De opmaak is fragiel, de formules moeten kloppen en blijven kloppen, en het resultaat oogt zelden zo strak als een document dat speciaal voor offertes is gemaakt. Voor een goede afweging is het de moeite waard om ook onze vergelijking van <a href="/blog/offerte-template-word-of-generator/">een template in Word of een generator</a> te lezen.</p>

<h2 id="opzet">Hoe zet je een offerte template in Excel op?</h2>
<p>De basis van een goede offerte template in Excel is een nette regeltabel met daaronder een totaaloverzicht. Begin bovenaan met je bedrijfsgegevens, je logo, de klantgegevens, een offertenummer en een datum. Daaronder komt de kern: de regeltabel.</p>
<p>Gebruik voor de regeltabel deze kolommen:</p>
<ul>
  <li><strong>Omschrijving.</strong> Wat lever je per regel. Houd dit concreet en begrijpelijk voor de klant.</li>
  <li><strong>Aantal.</strong> Het aantal stuks, uren of vierkante meters.</li>
  <li><strong>Eenheid.</strong> Bijvoorbeeld stuks, uur of m2.</li>
  <li><strong>Prijs per stuk.</strong> De prijs exclusief BTW per eenheid.</li>
  <li><strong>BTW-tarief.</strong> 21%, 9% of 0%, afhankelijk van wat je levert.</li>
  <li><strong>Regeltotaal exclusief BTW.</strong> Aantal maal prijs per stuk, via een formule.</li>
</ul>
<p>Onder de regeltabel zet je het totaaloverzicht: subtotaal exclusief BTW, de BTW per tarief uitgesplitst en het eindtotaal inclusief BTW. Wat er verder allemaal op hoort te staan, lees je in <a href="/blog/wat-moet-er-op-een-offerte-staan/">wat moet er op een offerte staan</a>.</p>

<h2 id="formules">Welke formules gebruik je in een Excel-offerte?</h2>
<p>De kracht van Excel zit in de formules. Hieronder de belangrijkste, in gewone taal beschreven zodat je ze in je eigen sjabloon kunt nabouwen. We noteren de kolommen als voorbeeld, pas de celverwijzingen aan op je eigen indeling.</p>
<table>
  <thead>
    <tr><th>Wat je berekent</th><th>Formule in woorden</th><th>Voorbeeld in Excel</th></tr>
  </thead>
  <tbody>
    <tr><td>Regeltotaal exclusief BTW</td><td>Aantal maal prijs per stuk</td><td>=B2*D2</td></tr>
    <tr><td>Subtotaal exclusief BTW</td><td>Som van alle regeltotalen</td><td>=SOM(E2:E12)</td></tr>
    <tr><td>BTW-bedrag per regel</td><td>Regeltotaal maal het BTW-tarief</td><td>=E2*F2</td></tr>
    <tr><td>BTW 21% totaal</td><td>Tel alleen de regels met 21% bij elkaar op</td><td>=SOMMEN.ALS(G2:G12;F2:F12;0,21)</td></tr>
    <tr><td>Totaal inclusief BTW</td><td>Subtotaal plus alle BTW samen</td><td>=E13+G13</td></tr>
  </tbody>
</table>
<p>De functie SOMMEN.ALS (in een Engelse Excel SUMIFS) is hierbij je beste vriend, want die telt alleen de regels op die aan een voorwaarde voldoen. Zo houd je 21%, 9% en 0% netjes uit elkaar. Heb je in een offerte maar één tarief, dan volstaat een gewone SOM. Hoe BTW precies op je offerte hoort, lees je in onze gids over <a href="/blog/btw-op-de-offerte/">BTW op de offerte</a>.</p>

<div class="callout">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
  <p>Noteer het BTW-tarief als een getal (0,21 in plaats van 21%) in een aparte kolom. Dan kun je er direct mee rekenen en voorkom je dat Excel een percentageteken als tekst behandelt en je formule een fout teruggeeft.</p>
</div>

<h2 id="voorbeeld">Hoe ziet een ingevulde Excel-offerte eruit?</h2>
<p>Ter illustratie een ingevulde voorbeeldofferte voor een kleine klus, met twee BTW-tarieven door elkaar. De bedragen zijn fictief en alleen bedoeld om de opbouw te tonen.</p>
<table>
  <thead>
    <tr><th>Omschrijving</th><th>Aantal</th><th>Prijs/stuk</th><th>BTW</th><th>Totaal excl.</th></tr>
  </thead>
  <tbody>
    <tr><td>Advies en voorbereiding (uur)</td><td>4</td><td>&euro; 65,00</td><td>21%</td><td>&euro; 260,00</td></tr>
    <tr><td>Uitvoering ter plaatse (uur)</td><td>8</td><td>&euro; 55,00</td><td>9%</td><td>&euro; 440,00</td></tr>
    <tr><td>Materiaal</td><td>1</td><td>&euro; 150,00</td><td>21%</td><td>&euro; 150,00</td></tr>
  </tbody>
</table>
<p>Daaronder volgt het totaaloverzicht met de BTW per tarief uitgesplitst. Zo ziet de klant precies waar welk tarief op rust.</p>
<table>
  <thead>
    <tr><th>Onderdeel</th><th>Bedrag</th></tr>
  </thead>
  <tbody>
    <tr><td>Subtotaal exclusief BTW</td><td>&euro; 850,00</td></tr>
    <tr><td>BTW 21% (over &euro; 410,00)</td><td>&euro; 86,10</td></tr>
    <tr><td>BTW 9% (over &euro; 440,00)</td><td>&euro; 39,60</td></tr>
    <tr><td><strong>Totaal inclusief BTW</strong></td><td><strong>&euro; 975,70</strong></td></tr>
  </tbody>
</table>
<p>Let op: het 9%-tarief geldt onder voorwaarden, bijvoorbeeld voor arbeid bij renovatie of schilderwerk aan woningen die ouder zijn dan twee jaar. Controleer per opdracht of dat tarief van toepassing is, want vul je het verkeerd in, dan klopt je hele BTW-uitsplitsing niet meer.</p>

{{CTA:Liever geen formules en scheve cellen?|Met Offertje vul je je regels in, kies je per regel het BTW-tarief en download je een verzorgde offerte als PDF. De totalen kloppen automatisch, zonder zelf formules te bouwen.}}

<h2 id="valkuilen">Waar moet je op letten bij een Excel-offerte?</h2>
<p>Excel rekent dan wel mee, maar het programma is niet voor offertes gebouwd. Dat levert een aantal hardnekkige valkuilen op waar veel ondernemers tegenaan lopen.</p>
<h3 id="opmaak-verschuift">De opmaak verschuift</h3>
<p>Voeg je een regel toe, typ je een langere omschrijving of verberg je een kolom, dan loopt je nette layout al snel scheef. Kolommen worden te smal, tekst valt weg achter een celrand en bij het printen springt je tabel naar een tweede pagina. Excel is gemaakt om te rekenen, niet om mooie documenten te maken, en dat zie je terug zodra je iets aanpast.</p>
<h3 id="formules-groeien-niet-mee">Formules groeien niet vanzelf mee</h3>
<p>Stel je hebt een SOM ingesteld over de cellen E2 tot E12 en je voegt een dertiende regel toe op E13, dan telt je formule die nieuwe regel niet mee. Je subtotaal klopt dan stilletjes niet meer, zonder waarschuwing. Dit is een van de meest gemaakte en moeilijkst te ontdekken fouten in zelfgebouwde Excel-offertes.</p>
<h3 id="handmatige-fouten">Eén verkeerde cel en je totaal klopt niet</h3>
<p>Overschrijf je per ongeluk een formule met een vast getal, of zet je een prijs in de verkeerde kolom, dan rekent Excel gewoon door met de verkeerde waarde. Het programma geeft geen seintje dat je offerte inhoudelijk niet meer klopt. Een offerte met een rekenfout in het totaal ondermijnt je geloofwaardigheid, hoe goed je werk verder ook is.</p>
<h3 id="versies-en-pdf">Versiechaos en het verkeerde bestand</h3>
<p>Werk je met losse Excel-bestanden, dan ontstaan al snel mappen vol varianten: offerte-definitief, offerte-definitief-2, en ga zo maar door. Voor je het weet stuur je het verkeerde bestand. Exporteer een offerte daarom altijd als PDF voordat je hem verstuurt, zodat de klant geen cellen kan aanpassen en de opmaak vastligt.</p>

<h2 id="excel-versus-generator">Excel-template versus online generator in één tabel</h2>
<p>Om de afweging makkelijk te maken, zetten we Excel en een online generator naast elkaar. Zo zie je in één oogopslag waar elk sterk en zwak is.</p>
<table>
  <thead>
    <tr><th>Aspect</th><th>Excel-template</th><th>Online generator</th></tr>
  </thead>
  <tbody>
    <tr><td>Kosten</td><td>Gratis, want al aanwezig</td><td>Bij Offertje gratis op te stellen</td></tr>
    <tr><td>Rekenen</td><td>Formules, mits foutloos opgezet</td><td>Automatisch en altijd kloppend</td></tr>
    <tr><td>Opmaak</td><td>Verschuift bij aanpassingen</td><td>Ligt vast, altijd netjes</td></tr>
    <tr><td>BTW per tarief</td><td>Zelf met SOMMEN.ALS opzetten</td><td>Per regel kiezen, automatisch uitgesplitst</td></tr>
    <tr><td>Risico op fouten</td><td>Hoog bij nieuwe regels of cellen</td><td>Laag, want geen handmatige formules</td></tr>
    <tr><td>PDF</td><td>Apart exporteren</td><td>Direct te downloaden</td></tr>
  </tbody>
</table>
<p>De cijfers in dit overzicht zijn algemeen bedoeld; jouw ervaring hangt af van hoe vaak je offreert en hoe handig je met Excel bent. Twijfel je nog tussen losse software, lees dan ook onze <a href="/blog/offerte-software-vergelijken/">vergelijking van offerte-software</a>.</p>

<h2 id="wanneer-excel-wanneer-generator">Wanneer kies je Excel en wanneer een generator?</h2>
<p>Het eerlijke antwoord is dat het van je situatie afhangt. Stuur je hooguit een paar keer per jaar een offerte en heb je geen bezwaar tegen wat geknutsel met cellen, dan kan een Excel-template prima volstaan. Je betaalt niets en als de opmaak een keertje wat ongelijk staat, is dat geen ramp. Wil je toch met Excel starten, lees dan eerst een <a href="/blog/offerte-voorbeeld/">offerte voorbeeld</a> om de basis goed neer te zetten.</p>
<p>Stuur je regelmatig offertes, wil je snel reageren en hecht je aan een consistente, foutloze uitstraling, dan loont een generator zich snel. De opmaak ligt vast, de BTW en totalen rekenen vanzelf en je downloadt elke keer een verzorgde PDF. Vooral voor zzp'ers telt dat zwaar: in onze gids over <a href="/blog/offerte-maken-als-zzper/">een offerte maken als zzp'er</a> lees je waarom snelheid en uitstraling juist voor zelfstandigen het verschil maken. Wil je gewoon meteen aan de slag, dan kun je ook <a href="/blog/gratis-offerte-maken/">gratis een offerte maken</a> zonder zelf een sjabloon te bouwen.</p>

<h2 id="conclusie">De keuze die je tijd en fouten bespaart</h2>
<p>Een offerte template in Excel is een prima startpunt als je zelden offreert en het rekenwerk graag aan formules overlaat. Het is gratis en rekent mee, wat het een stap beter maakt dan Word. Maar zodra je vaker een offerte stuurt, beginnen de zwakke plekken te knellen: de opmaak verschuift, je formules groeien niet vanzelf mee en één verkeerde cel maakt je totaal stilletjes onbetrouwbaar.</p>
<p>Een online generator lost precies die problemen op. De opmaak ligt vast, de BTW en totalen rekenen automatisch en je downloadt elke keer een nette PDF, zonder zelf een formule te bouwen. <a href="/app">Maak je offerte met Offertje</a> en ervaar zelf hoeveel sneller en betrouwbaarder het gaat dan met een Excel-sjabloon. Meer tips om je offertes te laten scoren, vind je in <a href="/blog/professionele-offerte-tips/">professionele offerte tips</a> en in onze gids over <a href="/blog/offerte-maken/">een offerte maken</a>.</p>
`,
    faq: [
        {
            q: 'Hoe maak ik een offerte template in Excel?',
            a: 'Zet bovenaan je bedrijfsgegevens, klantgegevens, een offertenummer en datum. Maak daaronder een regeltabel met kolommen voor omschrijving, aantal, prijs per stuk, BTW-tarief en regeltotaal, en koppel daar formules aan voor het subtotaal, de BTW en het totaal. Exporteer het resultaat als PDF voordat je het verstuurt.',
        },
        {
            q: 'Welke formule gebruik ik voor de BTW in Excel?',
            a: 'Vermenigvuldig het regeltotaal exclusief BTW met het tarief, bijvoorbeeld =E2*0,21 voor 21%. Werk je met meerdere tarieven in één offerte, gebruik dan SOMMEN.ALS (SUMIFS) om alleen de regels met hetzelfde tarief op te tellen, zodat je 21%, 9% en 0% netjes uit elkaar houdt.',
        },
        {
            q: 'Wat zijn de grootste valkuilen van een offerte in Excel?',
            a: 'De opmaak verschuift bij elke aanpassing, formules groeien niet automatisch mee als je een regel toevoegt, en één verkeerde cel maakt je totaal onbetrouwbaar zonder waarschuwing. Daarnaast ontstaat snel versiechaos. Een vaste layout en automatische berekening, zoals een generator biedt, voorkomt deze problemen.',
        },
        {
            q: 'Is een offerte template in Excel beter dan in Word?',
            a: 'Voor het rekenwerk wel, want Excel berekent subtotaal, BTW en totaal met formules, terwijl je in Word alles met de hand uitrekent. Voor de opmaak is geen van beide ideaal, want in beide verschuift de layout snel. Lees onze vergelijking van <a href="/blog/offerte-template-word-of-generator/">een template in Word of een generator</a> voor de volledige afweging.',
        },
        {
            q: 'Wanneer is een online generator beter dan Excel?',
            a: 'Offreer je regelmatig en wil je snelheid, een consistente uitstraling en foutloze totalen, dan is een online generator de betere keuze. De opmaak ligt vast en de BTW rekent vanzelf, zonder dat je formules bouwt. Je kunt zelfs direct <a href="/app">gratis een offerte opstellen</a> en als PDF downloaden.',
        },
    ],
    related: ['offerte-template-word-of-generator', 'offerte-maken', 'gratis-offerte-maken'],
};
