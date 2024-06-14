import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
 
import { Site } from 'src/app/models/site.model';
import { SitesService } from 'src/app/services/sites.service';

@Component({
  selector: 'app-espace-detail',
  templateUrl: './espace-detail.component.html',
  styleUrls: ['./espace-detail.component.scss']
})
export class EspaceDetailComponent implements OnInit {
  site: Site | undefined;
  sites: Site[] = [];

  constructor(
    private route: ActivatedRoute,
    private siteService: SitesService
  ) {}

  ngOnInit(): void {
    this.siteService.getSites().subscribe((data: Site[]) => {
      this.sites = data;
      const slug = this.route.snapshot.paramMap.get('slug');
      this.site = this.sites.find(site => site.slug === slug);
    });
  }
}
