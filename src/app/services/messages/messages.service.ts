import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material';

import { Message, MessageSource } from './../../objects/message';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  messages: Message[] = [];
  visibleSources: MessageSource[] = [MessageSource.Admin, MessageSource.Buildings, MessageSource.Main, MessageSource.Enemy,
    MessageSource.Unit, MessageSource.Map, MessageSource.Resources, MessageSource.Settings,
    MessageSource.Store, MessageSource.Upgrades, MessageSource.Workers];
  messagesDataSource = new MatTableDataSource(this.messages);
  messageLimit = 50;

  constructor() { }

  add(source: MessageSource, message: string) {
    if (this.messages.length >= this.messageLimit) {
      this.messages = this.messages.slice(1);
    }

    this.messages.push(new Message(source, message));

    this.getFilteredMessages();
  }

  clear() {
    this.messages = [];
    this.messagesDataSource.data = [];
  }

  getFilteredMessages() {
    this.messagesDataSource.data = this.messages.filter(message => this.visibleSources.includes(message.source));
  }
}
