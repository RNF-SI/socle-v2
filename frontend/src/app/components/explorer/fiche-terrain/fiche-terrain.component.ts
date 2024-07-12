import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Site } from 'src/app/models/site.model';
import { SitesService } from 'src/app/services/sites.service';


@Component({
  selector: 'app-fiche-terrain',
  templateUrl: './fiche-terrain.component.html',
  styleUrls: ['./fiche-terrain.component.scss'],
  
})
export class FicheTerrainComponent implements OnInit {
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

