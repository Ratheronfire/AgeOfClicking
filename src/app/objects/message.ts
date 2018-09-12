export enum MessageSource {
  Admin = 'ADMIN',
  Buildings = 'BUILDINGS',
  Main = 'MAIN',
  Enemy = 'ENEMY',
  Fighter = 'FIGHTER',
  Map = 'MAP',
  Resources = 'RESOURCES',
  Settings = 'SETTINGS',
  Store = 'STORE',
  Upgrades = 'UPGRADES',
  Workers = 'WORKERS'
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
