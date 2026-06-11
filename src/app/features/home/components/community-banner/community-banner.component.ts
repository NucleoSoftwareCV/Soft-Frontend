import { Component } from '@angular/core';

@Component({
  selector: 'app-community-banner',
  standalone: true,
  imports: [],
  templateUrl: './community-banner.component.html',
  styleUrl:    './community-banner.component.css',
})
export class CommunityBannerComponent {
  readonly whatsappUrl = 'https://chat.whatsapp.com/oona-comunidad';

  readonly memberAvatars = [
    'https://i.pravatar.cc/40?img=1',
    'https://i.pravatar.cc/40?img=2',
    'https://i.pravatar.cc/40?img=3',
    'https://i.pravatar.cc/40?img=4',
    'https://i.pravatar.cc/40?img=5',
  ];
}
