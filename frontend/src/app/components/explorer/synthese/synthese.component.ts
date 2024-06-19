import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MiniQuestService } from 'src/app/services/mini-quest.service';

@Component({
  selector: 'app-synthese',
  templateUrl: './synthese.component.html',
  styleUrls: ['./synthese.component.scss']
})
export class SyntheseComponent implements OnInit {
  responses: any;
  router: any;
  siteSlug: any;

  constructor(
    private miniQuestService: MiniQuestService,
    private route: ActivatedRoute
  ) { }
  
  ngOnInit(): void {
    this.siteSlug = this.route.snapshot.paramMap.get('slug')!;
    console.log(this.siteSlug)
    this.miniQuestService.getMiniQuest(this.siteSlug).subscribe(
      data => {
        this.responses = data;
        console.log(this.responses);
      },
      error => {
        console.error('Error fetching responses', error);
      }
    );
  }
}
