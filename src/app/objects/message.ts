export enum MessageSource {
  Admin = 'ADMIN',
  Buildings = 'BUILDINGS',
  Main = 'MAIN',
  Enemy = 'ENEMY',
  Unit = 'UNIT',
  Map = 'MAP',
  Resources = 'RESOURCES',
  Settings = 'SETTINGS',
  Store = 'STORE',
  Upgrades = 'UPGRADES',
  Tasks = 'TASKS'
}

export class Message {
  source: MessageSource;
  message: string;
  timestamp: number;

  constructor(source: MessageSource, message: string) {
    this.source = source;
    this.message = message;
    this.timestamp = Date.now();
  }
}
