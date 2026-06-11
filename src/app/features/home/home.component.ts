import { Component } from '@angular/core';
import { HeroComponent }              from './components/hero/hero.component';
import { CategoriesComponent }        from './components/categories/categories.component';
import { EventRowComponent, EventItem } from './components/event-row/event-row.component';
import { ProfessionalsGridComponent } from './components/professionals-grid/professionals-grid.component';
import { CommunityBannerComponent }   from './components/community-banner/community-banner.component';
import { CtaBannerComponent }         from './components/cta-banner/cta-banner.component';

const IMG = {
  yoga1:   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
  yoga2:   'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&auto=format&fit=crop&q=80',
  yoga3:   'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&auto=format&fit=crop&q=80',
  yoga4:   'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
  pilates: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=600&auto=format&fit=crop&q=80',
  retiro1: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
  retiro2: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
  sound:   'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&auto=format&fit=crop&q=80',
  nature1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  nature2: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80',
  nature3: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop&q=80',
  baby:    'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&auto=format&fit=crop&q=80',
  beach:   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  dance:   'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=600&auto=format&fit=crop&q=80',
  breath:  'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?w=600&auto=format&fit=crop&q=80',
  run:     'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
  mtn:     'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
  tuscany: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
  forest:  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
  sunset:  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&auto=format&fit=crop&q=80',
  group1:  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
  group2:  'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=600&auto=format&fit=crop&q=80',
};

const av = (n: number) => `https://i.pravatar.cc/40?img=${n}`;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    CategoriesComponent,
    EventRowComponent,
    ProfessionalsGridComponent,
    CommunityBannerComponent,
    CtaBannerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl:    './home.component.css',
})
export class HomeComponent {

  onOpenFilter(): void {
    window.dispatchEvent(new CustomEvent('oona:open-filter'));
  }

  /* ── Planes para este fin de semana ── */
  weekend: EventItem[] = [
    { id: 101, title: 'Pilates Contrologia',                                  dateLabel: 'VIE 12 JUN · 02:30', recurrent: true,  location: 'Valencia',    host: 'Ruth Reyna Vidal',  hostAvatar: av(10), image: IMG.pilates, spotsLeft: null },
    { id: 102, title: 'Retiro: VIVIR·SER 3 días para volver a ti de verdad',  dateLabel: 'VIE 12 JUN · 09:00', recurrent: false, location: 'Valencia',    host: 'Ruth Reyna Vidal',  hostAvatar: av(11), image: IMG.retiro1, spotsLeft: null },
    { id: 103, title: 'Taller porteo ergonómico',                             dateLabel: 'VIE 12 JUN · 10:30', recurrent: false, location: 'Valencia',    host: 'Sara Sevilla Mena', hostAvatar: av(12), image: IMG.baby,    spotsLeft: null },
    { id: 104, title: 'Retiro Honra tu presencia',                            dateLabel: 'VIE 12 JUN · 11:00', recurrent: false, location: 'Valencia',    host: 'Retiro Esencia',    hostAvatar: av(13), image: IMG.sound,   spotsLeft: null },
    { id: 105, title: 'Yoga Flow en la playa al amanecer',                    dateLabel: 'SÁB 13 JUN · 07:00', recurrent: false, location: 'Valencia',    host: 'Ana García',        hostAvatar: av(14), image: IMG.beach,   spotsLeft: 8    },
    { id: 106, title: 'Meditación con cuencos tibetanos',                     dateLabel: 'SÁB 13 JUN · 10:00', recurrent: true,  location: 'Valencia',    host: 'Pamela Parreño',    hostAvatar: av(15), image: IMG.sound,   spotsLeft: null },
    { id: 107, title: 'Bootcamp Yoga Stretch & Brunch',                       dateLabel: 'SÁB 13 JUN · 11:00', recurrent: false, location: 'Valencia',    host: 'Giulia Forni',      hostAvatar: av(16), image: IMG.yoga1,   spotsLeft: null },
    { id: 108, title: 'Breathwork & Liberación Emocional',                    dateLabel: 'SÁB 13 JUN · 17:00', recurrent: false, location: 'Valencia',    host: 'Marcos Vidal',      hostAvatar: av(17), image: IMG.breath,  spotsLeft: 5    },
    { id: 109, title: 'Caminata consciente por la naturaleza',                dateLabel: 'DOM 14 JUN · 08:00', recurrent: false, location: 'Benimantell', host: 'Lorene Chauvel',    hostAvatar: av(18), image: IMG.nature2, spotsLeft: null },
    { id: 110, title: 'Taller de danza intuitiva y movimiento',               dateLabel: 'DOM 14 JUN · 11:00', recurrent: false, location: 'Valencia',    host: 'Lucía Moreno',      hostAvatar: av(19), image: IMG.dance,   spotsLeft: null },
    { id: 111, title: 'Retiro de silencio y meditación',                      dateLabel: 'DOM 14 JUN · 09:00', recurrent: false, location: 'Xàtiva',     host: 'Pausa Holistic',    hostAvatar: av(20), image: IMG.retiro2, spotsLeft: 4    },
    { id: 112, title: 'Running mindful por el jardín del Turia',              dateLabel: 'DOM 14 JUN · 08:30', recurrent: true,  location: 'Valencia',    host: 'Javier Ruiz',       hostAvatar: av(21), image: IMG.run,     spotsLeft: null },
  ];

  /* ── Yoga ── */
  yoga: EventItem[] = [
    { id: 201, title: 'Beach Yoga x Erika + Brunch x Allgood House',           dateLabel: 'SÁB 13 JUN · 01:00', recurrent: false, location: 'Denia',       host: 'ALLGOODHOUSE',      hostAvatar: av(22), image: IMG.beach,   spotsLeft: null },
    { id: 202, title: 'Amanece en la Playa con Yoga & Sonido',                 dateLabel: 'SÁB 13 JUN · 01:00', recurrent: false, location: 'Valencia',    host: 'Cuencos con Cami',  hostAvatar: av(23), image: IMG.yoga2,   spotsLeft: null },
    { id: 203, title: 'Experiencia Compartida: Vive un viaje sonoro de a dos', dateLabel: 'SÁB 13 JUN · 11:00', recurrent: true,  location: 'Valencia',    host: 'Cuencos con Cami',  hostAvatar: av(24), image: IMG.sound,   spotsLeft: null },
    { id: 204, title: 'Bootcamp, Yoga Stretch & Brunch at Turia',              dateLabel: 'DOM 14 JUN · 03:00', recurrent: false, location: 'Valencia',    host: 'Giulia Forni',      hostAvatar: av(25), image: IMG.yoga1,   spotsLeft: null },
    { id: 205, title: 'Yoga Vinyasa en el parque',                             dateLabel: 'LUN 15 JUN · 09:00', recurrent: true,  location: 'Valencia',    host: 'Ana García',        hostAvatar: av(26), image: IMG.yoga3,   spotsLeft: null },
    { id: 206, title: 'Yoga restaurativo al atardecer',                        dateLabel: 'MAR 16 JUN · 19:00', recurrent: true,  location: 'Valencia',    host: 'Ruth Reyna Vidal',  hostAvatar: av(27), image: IMG.yoga4,   spotsLeft: 6    },
    { id: 207, title: 'Yoga aéreo — nivel iniciación',                         dateLabel: 'MIÉ 17 JUN · 10:00', recurrent: true,  location: 'Valencia',    host: 'Ruth Reyna Vidal',  hostAvatar: av(28), image: IMG.pilates, spotsLeft: null },
    { id: 208, title: 'Yoga Nidra: meditación profunda',                       dateLabel: 'JUE 18 JUN · 20:00', recurrent: true,  location: 'Valencia',    host: 'Pamela Parreño',    hostAvatar: av(29), image: IMG.retiro1, spotsLeft: null },
    { id: 209, title: 'Yin Yoga & Sonido Vibracional',                         dateLabel: 'VIE 19 JUN · 18:30', recurrent: false, location: 'Valencia',    host: 'Lorene Chauvel',    hostAvatar: av(30), image: IMG.sound,   spotsLeft: 3    },
    { id: 210, title: 'Yoga Kundalini — despertar energético',                 dateLabel: 'SÁB 20 JUN · 09:00', recurrent: false, location: 'Benimantell', host: 'Lucía Moreno',      hostAvatar: av(31), image: IMG.nature1, spotsLeft: null },
    { id: 211, title: 'Hatha Yoga para principiantes',                         dateLabel: 'DOM 21 JUN · 10:00', recurrent: true,  location: 'Valencia',    host: 'Marcos Vidal',      hostAvatar: av(32), image: IMG.yoga2,   spotsLeft: null },
    { id: 212, title: 'Yoga en familia con niños',                             dateLabel: 'DOM 21 JUN · 12:00', recurrent: false, location: 'Valencia',    host: 'Sara Sevilla Mena', hostAvatar: av(33), image: IMG.baby,    spotsLeft: 7    },
  ];

  /* ── Breathwork y baños de hielo ── */
  breathwork: EventItem[] = [
    { id: 301, title: 'BODHI Sunrise Reset: Breathwork & Mar',                      dateLabel: 'VIE 19 JUN · 00:00',  recurrent: false, location: 'Valencia',    host: 'Lorene Chauvel',  hostAvatar: av(34), image: IMG.beach,   spotsLeft: null },
    { id: 302, title: 'Community mornings: Sound bath + circuito ice bath y sauna', dateLabel: 'DOM 28 JUN · 02:30',  recurrent: false, location: 'Valencia',    host: 'Pamela Parreño',  hostAvatar: av(35), image: IMG.sound,   spotsLeft: null },
    { id: 303, title: 'PRANA: Yoga Vinyasa, Breathwork y Baño de hielo',            dateLabel: 'SÁB 11 JUL · 10:30', recurrent: false, location: 'Benimantell', host: 'Pausa Holistic',  hostAvatar: av(36), image: IMG.nature3, spotsLeft: null },
    { id: 304, title: 'Respiración holotrópica — liberación profunda',              dateLabel: 'SÁB 13 JUN · 16:00', recurrent: false, location: 'Valencia',    host: 'Marcos Vidal',    hostAvatar: av(37), image: IMG.breath,  spotsLeft: 6    },
  ];

  /* ── Para desconectar y bajar el ritmo ── */
  disconnect: EventItem[] = [
    { id: 401, title: 'Retiro de Higiene Energética — Recupera tu Energía',  dateLabel: 'MAÑANA · 02:00',     recurrent: false, location: 'Valencia',    host: 'Illanith Benjamin', hostAvatar: av(38), image: IMG.retiro1, spotsLeft: null },
    { id: 402, title: 'Yoga Aéreo. Una experiencia que te reta',             dateLabel: 'MAÑANA · 10:00',     recurrent: true,  location: 'Valencia',    host: 'Ruth Reyna Vidal',  hostAvatar: av(39), image: IMG.pilates, spotsLeft: 5    },
    { id: 403, title: 'Pilates Aéreo. Llevas tu cuerpo a otro nivel',        dateLabel: 'MAÑANA · 10:00',     recurrent: true,  location: 'Valencia',    host: 'Ruth Reyna Vidal',  hostAvatar: av(40), image: IMG.yoga4,   spotsLeft: null },
    { id: 404, title: 'Pilates Contrologia',                                 dateLabel: 'VIE 12 JUN · 02:30', recurrent: true,  location: 'Valencia',    host: 'Ruth Reyna Vidal',  hostAvatar: av(41), image: IMG.pilates, spotsLeft: null },
    { id: 405, title: 'Meditación guiada para reducir el estrés',            dateLabel: 'VIE 12 JUN · 08:00', recurrent: true,  location: 'Valencia',    host: 'Ana García',        hostAvatar: av(42), image: IMG.retiro2, spotsLeft: null },
    { id: 406, title: 'Cacao ceremony — reconecta con tu centro',            dateLabel: 'VIE 12 JUN · 19:00', recurrent: false, location: 'Valencia',    host: 'Lorene Chauvel',    hostAvatar: av(43), image: IMG.nature1, spotsLeft: 10   },
    { id: 407, title: 'Baño de sonido con cuencos tibetanos',                dateLabel: 'SÁB 13 JUN · 18:00', recurrent: true,  location: 'Valencia',    host: 'Cuencos con Cami',  hostAvatar: av(44), image: IMG.sound,   spotsLeft: null },
    { id: 408, title: 'Shinrin-yoku: baño de bosque consciente',             dateLabel: 'SÁB 13 JUN · 09:00', recurrent: false, location: 'Benimantell', host: 'Pausa Holistic',    hostAvatar: av(45), image: IMG.nature2, spotsLeft: 4    },
    { id: 409, title: 'Noche de Yin Yoga y meditación profunda',             dateLabel: 'SÁB 13 JUN · 21:00', recurrent: false, location: 'Valencia',    host: 'Pamela Parreño',    hostAvatar: av(46), image: IMG.yoga3,   spotsLeft: null },
    { id: 410, title: 'Retiro de fin de semana: silencio y naturaleza',      dateLabel: 'DOM 14 JUN · 08:00', recurrent: false, location: 'Xàtiva',     host: 'Javier Ruiz',       hostAvatar: av(47), image: IMG.nature3, spotsLeft: 6    },
    { id: 411, title: 'Yoga Nidra: el sueño consciente',                     dateLabel: 'DOM 14 JUN · 17:00', recurrent: true,  location: 'Valencia',    host: 'Lucía Moreno',      hostAvatar: av(48), image: IMG.retiro1, spotsLeft: null },
    { id: 412, title: 'Journaling terapéutico y escritura libre',            dateLabel: 'DOM 14 JUN · 11:00', recurrent: false, location: 'Valencia',    host: 'Marcos Vidal',      hostAvatar: av(49), image: IMG.retiro2, spotsLeft: null },
  ];

  /* ── Talleres para vivir algo diferente ── */
  workshops: EventItem[] = [
    { id: 501, title: 'Taller porteo ergonómico',                         dateLabel: 'VIE 12 JUN · 10:30', recurrent: false, location: 'Valencia',    host: 'Sara Sevilla Mena', hostAvatar: av(50), image: IMG.baby,    spotsLeft: null },
    { id: 502, title: 'Taller NeuroAroma Experience',                     dateLabel: 'VIE 12 JUN · 11:30', recurrent: false, location: 'Valencia',    host: 'deSantaTeresa',     hostAvatar: av(51), image: IMG.sound,   spotsLeft: null },
    { id: 503, title: 'Yoga stretch y sound healing',                     dateLabel: 'VIE 12 JUN · 12:00', recurrent: false, location: 'Valencia',    host: 'Nude Studio',       hostAvatar: av(52), image: IMG.yoga1,   spotsLeft: null },
    { id: 504, title: 'Training Camp Black Box Reus',                     dateLabel: 'SÁB 13 JUN · 02:30', recurrent: false, location: 'Valencia',    host: 'Lorene Chauvel',    hostAvatar: av(53), image: IMG.run,     spotsLeft: null },
    { id: 505, title: 'Taller de cerámica y mindfulness',                 dateLabel: 'SÁB 13 JUN · 10:00', recurrent: false, location: 'Valencia',    host: 'Ana García',        hostAvatar: av(54), image: IMG.dance,   spotsLeft: 8    },
    { id: 506, title: 'Fermentación casera y microbiota',                 dateLabel: 'SÁB 13 JUN · 11:00', recurrent: false, location: 'Valencia',    host: 'Lucía Moreno',      hostAvatar: av(55), image: IMG.nature1, spotsLeft: null },
    { id: 507, title: 'Fotografía consciente en la naturaleza',           dateLabel: 'SÁB 13 JUN · 09:00', recurrent: false, location: 'Benimantell', host: 'Javier Ruiz',       hostAvatar: av(56), image: IMG.nature2, spotsLeft: 5    },
    { id: 508, title: 'Cocina ayurvédica — descubre tu dosha',            dateLabel: 'SÁB 13 JUN · 17:00', recurrent: false, location: 'Valencia',    host: 'Pausa Holistic',    hostAvatar: av(57), image: IMG.retiro2, spotsLeft: null },
    { id: 509, title: 'Taller de escritura creativa y autoconocimiento',  dateLabel: 'DOM 14 JUN · 10:00', recurrent: false, location: 'Valencia',    host: 'Pamela Parreño',    hostAvatar: av(58), image: IMG.retiro1, spotsLeft: null },
    { id: 510, title: 'Acuarela y meditación activa',                     dateLabel: 'DOM 14 JUN · 11:00', recurrent: false, location: 'Valencia',    host: 'Cuencos con Cami',  hostAvatar: av(59), image: IMG.dance,   spotsLeft: 10   },
    { id: 511, title: 'Taller de macramé y bienestar creativo',           dateLabel: 'DOM 14 JUN · 12:00', recurrent: false, location: 'Valencia',    host: 'deSantaTeresa',     hostAvatar: av(60), image: IMG.nature3, spotsLeft: null },
    { id: 512, title: 'Canto de mantras y apertura del corazón',          dateLabel: 'DOM 14 JUN · 18:00', recurrent: false, location: 'Valencia',    host: 'Illanith Benjamin', hostAvatar: av(61), image: IMG.sound,   spotsLeft: 3    },
  ];

  /* ── Retiros e inmersiones ── */
  retreats: EventItem[] = [
    { id: 601, title: 'Retiro 1 día "Al Natural" – Crecimiento personal en la naturaleza', dateLabel: 'DOM 21 JUN · 03:00', recurrent: false, location: 'Valencia',   host: 'Susana Llovera',    hostAvatar: av(62), image: IMG.group1,  spotsLeft: null },
    { id: 602, title: 'Retiro Esencia - Mas Dàlia, Empordà',                              dateLabel: 'VIE 26 JUN · 10:00', recurrent: false, location: 'Barcelona',  host: 'Meraki Experience', hostAvatar: av(63), image: IMG.retiro2, spotsLeft: null },
    { id: 603, title: 'Retiro Rinascita Cocoon',                                          dateLabel: 'SÁB 27 JUN · 10:00', recurrent: false, location: 'Florencia',  host: 'Anna Berardi',      hostAvatar: av(64), image: IMG.tuscany, spotsLeft: null },
    { id: 604, title: 'Volver al centro. Retiro de un día para reconectar contigo a...', dateLabel: 'DOM 28 JUN · 03:00', recurrent: false, location: 'Valencia',   host: 'La Colmena',        hostAvatar: av(65), image: IMG.sunset,  spotsLeft: null },
    { id: 605, title: 'Retiro de meditación vipassana 3 días',                           dateLabel: 'VIE 3 JUL · 18:00',  recurrent: false, location: 'Xàtiva',    host: 'Pausa Holistic',    hostAvatar: av(66), image: IMG.forest,  spotsLeft: 6    },
    { id: 606, title: 'Retiro de yoga y naturaleza en la montaña',                       dateLabel: 'SÁB 4 JUL · 08:00',  recurrent: false, location: 'Benimantell',host: 'Ana García',        hostAvatar: av(67), image: IMG.mtn,     spotsLeft: null },
    { id: 607, title: 'Inmersión de breathwork y baño de hielo — fin de semana',         dateLabel: 'SÁB 4 JUL · 10:00',  recurrent: false, location: 'Valencia',   host: 'Marcos Vidal',      hostAvatar: av(68), image: IMG.breath,  spotsLeft: 8    },
    { id: 608, title: 'Retiro de escritura y autoconocimiento en Mallorca',              dateLabel: 'VIE 10 JUL · 17:00', recurrent: false, location: 'Mallorca',   host: 'Lorene Chauvel',    hostAvatar: av(69), image: IMG.beach,   spotsLeft: null },
    { id: 609, title: 'Retiro de cocina ayurvédica y bienestar',                        dateLabel: 'SÁB 11 JUL · 10:00', recurrent: false, location: 'Valencia',   host: 'Lucía Moreno',      hostAvatar: av(70), image: IMG.nature1, spotsLeft: 4    },
    { id: 610, title: 'Inmersión de danza y movimiento consciente',                     dateLabel: 'DOM 12 JUL · 10:00', recurrent: false, location: 'Valencia',   host: 'Javier Ruiz',       hostAvatar: av(71), image: IMG.dance,   spotsLeft: null },
    { id: 611, title: 'Retiro de silencio — 2 días en la naturaleza',                   dateLabel: 'SÁB 18 JUL · 09:00', recurrent: false, location: 'Castellón',  host: 'Retiro Esencia',    hostAvatar: av(72), image: IMG.nature2, spotsLeft: 5    },
    { id: 612, title: 'Semana de yoga y meditación en la Costa Brava',                  dateLabel: 'LUN 20 JUL · 17:00', recurrent: false, location: 'Girona',     host: 'Meraki Experience', hostAvatar: av(73), image: IMG.group2,  spotsLeft: null },
  ];
}
