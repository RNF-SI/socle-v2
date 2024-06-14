import { Component, OnInit } from '@angular/core';
import { MiniQuestService } from 'src/app/services/mini-quest.service';

@Component({
  selector: 'app-synthese',
  templateUrl: './synthese.component.html',
  styleUrls: ['./synthese.component.scss']
})
export class SyntheseComponent implements OnInit {
  responses: any;
  router: any;

  constructor(private miniQuestService: MiniQuestService) { }

  ngOnInit(): void {
    this.responses = this.miniQuestService.getResponses('current');
    console.log(this.responses);
  }
 
  
}
