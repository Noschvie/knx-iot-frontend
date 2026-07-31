import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MonitorComponent } from './monitor.component';

const routes: Routes = [
  { path: '', component: MonitorComponent }
];

@NgModule({
  declarations: [MonitorComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class MonitorModule {}
