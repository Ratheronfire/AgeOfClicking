import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material';

import { Message, MessageSource } from './../../objects/message';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  messages: Message[] = [];
  messagesDataSource = new MatTableDataSource(this.messages);
  messageLimit = 50;

  constructor() { }

  add(source: MessageSource, message: string) {
    if (this.messages.length >= this.messageLimit) {
      this.messages = this.messages.slice(1);
    }

    this.messages.push(new Message(source, message));

    this.messagesDataSource.data = [...this.messages];
  }

  clear() {
    this.messages = [];
    this.messagesDataSource.data = [];
  }

  getFilteredMessages(sources: MessageSource[]): Message[] {
    return this.messages.filter(message => message.source in sources);
  }
}
