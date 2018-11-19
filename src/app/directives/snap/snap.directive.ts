import { Directive, HostListener, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appSnap]'
})
export class SnapDirective {
  constructor(private element: ElementRef) { }

  @Input('snapSetting') snapSetting: string;

  @HostListener('click') onClick() {
    switch (this.snapSetting) {
      case 'upperLeft': {
        this.element.nativeElement.style.left = 0;
        this.element.nativeElement.style.top = '72px';
        this.element.nativeElement.style.right = 'unset';
        this.element.nativeElement.style.bottom = 'unset';
        break;
      } case 'upperRight': {
        this.element.nativeElement.style.left = 'unset';
        this.element.nativeElement.style.top = '72px';
        this.element.nativeElement.style.right = 0;
        this.element.nativeElement.style.bottom = 'unset';
        break;
      } case 'lowerLeft': {
        this.element.nativeElement.style.left = 0;
        this.element.nativeElement.style.top = 'unset';
        this.element.nativeElement.style.right = 'unset';
        this.element.nativeElement.style.bottom = 0;
        break;
      } case 'lowerRight': {
        this.element.nativeElement.style.left = 'unset';
        this.element.nativeElement.style.top = 'unset';
        this.element.nativeElement.style.right = 0;
        this.element.nativeElement.style.bottom = 0;
        break;
      }
    }
  }
}
