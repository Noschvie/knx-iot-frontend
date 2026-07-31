import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LogsComponent } from './logs.component';

const routes: Routes = [
  { path: '', component: LogsComponent }
];

@NgModule({
  declarations: [LogsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class LogsModule {}
