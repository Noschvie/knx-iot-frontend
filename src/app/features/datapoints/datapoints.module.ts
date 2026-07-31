import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DatapointsComponent } from './datapoints.component';

const routes: Routes = [
  { path: '', component: DatapointsComponent }
];

@NgModule({
  declarations: [DatapointsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class DatapointsModule {}
