import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toNumber',
  standalone: false
})
export class ToNumberPipe implements PipeTransform {
  transform(value: any): number {
    if (value instanceof Event) {
      return parseInt((value.target as HTMLInputElement).value, 10);
    }
    return parseInt(value, 10);
  }
}
