import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Eventos } from '../explorar/eventos/eventos';

@Component({
  selector: 'app-retiros',
  standalone: true,
  imports: [CommonModule, Eventos],
  templateUrl: './retiros.html',
  styleUrl: './retiros.css'
})
export class Retiros {}