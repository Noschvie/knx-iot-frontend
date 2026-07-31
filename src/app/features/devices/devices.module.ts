import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DevicesComponent } from './devices.component';

const routes: Routes = [
  { path: '', component: DevicesComponent }
];

@NgModule({
  declarations: [DevicesComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class DevicesModule {}
