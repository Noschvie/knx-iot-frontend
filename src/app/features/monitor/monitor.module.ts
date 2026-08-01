import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MonitorComponent } from './monitor.component';

const routes: Routes = [
  { path: '', component: MonitorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes), MonitorComponent]
})
export class MonitorModule {}
