import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  public filterAccessible = true;
  public editMode = false;

  constructor() { }
}
