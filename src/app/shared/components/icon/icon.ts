import { Component, input } from '@angular/core';

export type IconName =
  | 'users'
  | 'user'
  | 'map-pin'
  | 'search'
  | 'carta' 
 

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.html',
  styleUrl: './icon.css',

})
export class AppIcon {

  name = input.required<IconName>();

  size = input<number>(18);

}