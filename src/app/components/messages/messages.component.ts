import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material';

import { Message, MessageSource } from './../../objects/message';
import { MessagesService } from '../../services/messages/messages.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;

  constructor(public messagesService: MessagesService) { }

  ngOnInit() {
    this.messagesService.messagesDataSource.sort = this.sort;
  }

  get messages(): Message[] {
    return this.messagesService.messages;
  }

  get displayedColumns(): string[] {
    return ['source', 'timestamp', 'message'];
  }
}
