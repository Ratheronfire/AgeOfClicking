import { GameService } from './../../game/game.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material';

import { Message, MessageSource } from './../../objects/message';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;

  constructor(public game: GameService) { }

  ngOnInit() {
    this.game.messages.messagesDataSource.sort = this.sort;
  }

  get messages(): Message[] {
    return this.game.messages.messages;
  }

  get displayedColumns(): string[] {
    return ['source', 'timestamp', 'message'];
  }
}
