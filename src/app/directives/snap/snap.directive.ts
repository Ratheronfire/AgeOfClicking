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
      } case 'free': {
        this.element.nativeElement.style.left = 'var(--detail-tooltip-left)';
        this.element.nativeElement.style.top = 'var(--detail-tooltip-top)';
        this.element.nativeElement.style.right = 'unset';
        this.element.nativeElement.style.bottom = 'unset';
        break;
      }
    }
  }

  @HostListener('mousemove') onMouseMove() {
    if (this.snapSetting !== 'free') {
      return;
    }

    const nativeElement = this.element.nativeElement;
    const containerElement = this.element.nativeElement.parentElement.parentElement;

    if (nativeElement.offsetTop < 0) {
      nativeElement.style.top = 0;
    } else if (nativeElement.offsetTop + nativeElement.clientHeight > containerElement.clientHeight) {
      nativeElement.style.top = containerElement.clientHeight - nativeElement.clientHeight;
    } else {
      nativeElement.style.top = 'var(--detail-tooltip-top)';
    }

    if (nativeElement.offsetLeft < 0) {
      nativeElement.style.left = 0;
    } else if (nativeElement.offsetLeft + nativeElement.clientWidth > containerElement.clientWidth) {
      nativeElement.style.left = containerElement.clientWidth - nativeElement.clientWidth;
    } else {
      nativeElement.style.left = 'var(--detail-tooltip-left)';
    }
  }
}
