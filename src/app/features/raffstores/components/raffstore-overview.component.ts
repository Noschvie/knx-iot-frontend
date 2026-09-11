import { Component, OnInit } from '@angular/core';
import { Raffstore } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';

@Component({
  standalone: false,
  selector: 'app-raffstore-overview',
  templateUrl: './raffstore-overview.component.html',
  styleUrls: ['./raffstore-overview.component.scss']
})
export class RaffstoreOverviewComponent implements OnInit {
  raffstore: Raffstore | null = null;
  isLoading = false;

  constructor(private raffstoreService: RaffstoreService) {}

  ngOnInit(): void {
    this.raffstoreService.getRaffstore().subscribe(raffstore => {
      this.raffstore = raffstore;
      console.log('[Overview] Raffstore updated:', raffstore);
    });
  }
}
