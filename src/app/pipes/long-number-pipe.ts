import { Pipe, PipeTransform } from '@angular/core';
import { formatNumber } from '@angular/common';

@Pipe({
  name: 'longNumber'
})
export class LongNumberPipe implements PipeTransform {
  shortScaleNames = ['Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion',
    'Decillion', 'Undecillion', 'Duodecillion', 'Tredecillion', 'Quattuordecillion', 'Quindecillion', 'Sexdecillion', 'Septendecillion',
    'Octodecillion', 'Novemdecillion', 'Vigintillion', 'Centillion'];

  transform(data: number, decimalsShown: number = 0) {
    if (data < 1000000) {
      return formatNumber(data, 'en-US', `1.0-${decimalsShown}`);
    } else if (Math.abs(data) >= Infinity) {
      return data.toString();
    }

    let nameIndex = -2;

    while (Math.abs(data) > 1000) {
      data /= 1000;
      nameIndex++;
    }

    return `${formatNumber(data, 'en-US', '1.0-3')} ${this.shortScaleNames[nameIndex]}`;
  }
}
