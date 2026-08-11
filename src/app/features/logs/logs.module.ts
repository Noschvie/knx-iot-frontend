import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LogsComponent } from './logs.component';

const routes: Routes = [
  { path: '', component: LogsComponent }
];

@NgModule({
  declarations: [LogsComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), TranslatePipe]
})
export class LogsModule {}
