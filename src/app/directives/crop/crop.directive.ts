import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appCrop]'
})
export class CropDirective {

  constructor(protected element: ElementRef,
              protected renderer: Renderer2) {
  // const tileCropDetail = this.mapService.getTile(
  //   +element.nativeElement.attributes['x'].value, +element.nativeElement.attributes['y'].value);

  this.renderer.setStyle(element.nativeElement, 'clip', 'rect(0, 0, 16, 16)');
  }
}
