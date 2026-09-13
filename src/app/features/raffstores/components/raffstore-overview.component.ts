import { Component, OnInit } from '@angular/core';
import { Raffstore } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';

@Component({
  selector: 'app-raffstore-overview',
  templateUrl: './raffstore-overview.component.html',
  styleUrls: ['./raffstore-overview.component.scss']
})
export class RaffstoreOverviewComponent implements OnInit {
  raffstores: Raffstore[] = [];
  raffstoresEG: Raffstore[] = [];
  raffstoresOG: Raffstore[] = [];

  constructor(private raffstoreService: RaffstoreService) {}

  ngOnInit(): void {
    this.raffstoreService.getRaffstores().subscribe(raffstores => {
      this.raffstores = raffstores;
      this.raffstoresEG = raffstores.filter(r => r.floor === 'EG');
      this.raffstoresOG = raffstores.filter(r => r.floor === 'OG');
    });
  }

  onGroupCommandUp(floor: 'EG' | 'OG'): void {
    this.raffstoreService.groupCommand(floor, 'up');
  }

  onGroupCommandDown(floor: 'EG' | 'OG'): void {
    this.raffstoreService.groupCommand(floor, 'down');
  }
}
