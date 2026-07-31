import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FunctionsComponent } from './functions.component';

const routes: Routes = [
  { path: '', component: FunctionsComponent }
];

@NgModule({
  declarations: [FunctionsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class FunctionsModule {}
