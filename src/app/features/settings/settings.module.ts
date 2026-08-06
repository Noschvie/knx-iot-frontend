import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
  { path: '', component: SettingsComponent }
];

@NgModule({
  declarations: [SettingsComponent],
  imports: [CommonModule, RouterModule.forChild(routes), TranslatePipe]
})
export class SettingsModule {}
