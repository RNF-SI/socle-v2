import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SitesService } from 'src/app/services/sites.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';
import { Site } from 'src/app/models/site.model';
import { GeologicalInterests } from 'src/app/models/geological-interests.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PatrimoineGeologiqueService } from 'src/app/services/patrimoine-geologique.service';

@Component({
  selector: 'app-espace-detail',
  templateUrl: './espace-detail.component.html',
  styleUrls: ['./espace-detail.component.scss']
})
export class EspaceDetailComponent implements OnInit {
  site: Site | undefined;
  tInfosBaseSite: any;
  patrimoineGeologique: any;
  geologicalInterests: string[] = [];
  paleontologicalLabels: string[] = [];
  principalHeritage: any[] = [];
  protectionHeritage: any[] = [];
  reserveContainsGeologicalHeritage: any[] = [];
  protectionPerimeterContainsGeologicalHeritage: any[] = [];
  siteSlug: any;

  constructor(
    private route: ActivatedRoute,
    private siteService: SitesService,
    private tInfosBaseSiteService: TInfosBaseSiteService,
    private patrimoineGeologiqueService: PatrimoineGeologiqueService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    console.log('Slug:', slug);

    if (slug) {
      this.siteService.getSites().subscribe((sites: Site[]) => {
        this.site = sites.find(site => site.slug === slug);
        console.log('Site:', this.site);

        if (this.site) {
          this.tInfosBaseSiteService.getSiteBySlug(slug).subscribe((data: any) => {
            console.log('Response data from getSiteBySlug:', data);
            this.tInfosBaseSite = data;
           
             
            

             
          });
        }

        this.fetchSiteDetails(this.siteSlug);

        this.fetchPatrimoineGeologique(this.site?.id_site);


      });
    }
  }
   

  fetchSiteDetails(slug: string){
    this.tInfosBaseSiteService.getTInfosBaseSites(slug).subscribe(
      (data: any) => {
        if(data && data.reserve_contains_geological_heritage_inpg && data.protection_perimeter_contains_geological_heritage_inpg ){
           this.reserveContainsGeologicalHeritage = data.reserve_contains_geological_heritage_inpg;
           this.protectionPerimeterContainsGeologicalHeritage = data.protection_perimeter_contains_geological_heritage_inpg;
        } else {
          console.error('les data', data);
        }
      },
      (error: any) => {
        console.error('Error fetching geological heritage data', error);
      }
    );

  }

  fetchPatrimoineGeologique(siteId: any): void {
    this.patrimoineGeologiqueService.getPatrimoineGeologique(siteId).subscribe(
      (data: any) => {
        if (data && data.principal && data.protection) {
          this.principalHeritage = data.principal;
          this.protectionHeritage = data.protection;
        } else {
          console.error('Unexpected data format:', data);
        }
      },
      (error: any) => {
        console.error('Error fetching geological heritage data', error);
      }
    );
  }

  setGeologicalHeritages(): void {
    this.principalHeritage = this.patrimoineGeologique?.geologicalHeritages || [];
  }

  setProtectionGeologicalHeritages(): void {
    this.protectionHeritage = this.patrimoineGeologique?.protectionGeologicalHeritages || [];
  }

  

   

  setPaleontologicalLabels(patrimoineGeologique: any): void {
    if (patrimoineGeologique?.contains_paleontological_heritage) {
      if (patrimoineGeologique.contains_paleontological_heritage_vertebrates) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('vertebrates'));
      }
      if (patrimoineGeologique.contains_paleontological_heritage_invertebrates) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('invertebrates'));
      }
      if (patrimoineGeologique.contains_paleontological_heritage_plants) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('plants'));
      }
      if (patrimoineGeologique.contains_paleontological_heritage_trace_fossils) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('traceFossils'));
      }
      if (patrimoineGeologique.contains_paleontological_heritage_other) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('other'));
        if (patrimoineGeologique.contains_paleontological_heritage_other_details) {
          this.paleontologicalLabels.push(`Préciser : ${patrimoineGeologique.contains_paleontological_heritage_other_details}`);
        }
      }
    }
  }

  setGeologicalInterests(patrimoineGeologique: any): void {
    const interests: GeologicalInterests = {
      stratigraphic: patrimoineGeologique?.main_geological_interests_stratigraphic,
      paleontological: patrimoineGeologique?.main_geological_interests_paleontological,
      sedimentological: patrimoineGeologique?.main_geological_interests_sedimentological,
      geomorphological: patrimoineGeologique?.main_geological_interests_geomorphological,
      mineral_resource: patrimoineGeologique?.main_geological_interests_mineral_resource,
      mineralogical: patrimoineGeologique?.main_geological_interests_mineralogical,
      metamorphism: patrimoineGeologique?.main_geological_interests_metamorphism,
      volcanism: patrimoineGeologique?.main_geological_interests_volcanism,
      plutonism: patrimoineGeologique?.main_geological_interests_plutonism,
      hydrogeology: patrimoineGeologique?.main_geological_interests_hydrogeology,
      tectonics: patrimoineGeologique?.main_geological_interests_tectonics
    };

    this.geologicalInterests = (Object.keys(interests) as (keyof GeologicalInterests)[])
      .filter(key => interests[key])
      .map(key => this.getInterestLabel(key));
  }

  getInterestLabel(key: keyof GeologicalInterests): string {
    const labels: { [key in keyof GeologicalInterests]: string } = {
      stratigraphic: 'Stratigraphique',
      paleontological: 'Paléontologique',
      sedimentological: 'Sédimentologique',
      geomorphological: 'Géomorphologique',
      mineral_resource: 'Ressource minérale',
      mineralogical: 'Minéralogique',
      metamorphism: 'Métamorphisme',
      volcanism: 'Volcanisme',
      plutonism: 'Plutonisme',
      hydrogeology: 'Hydrogéologie',
      tectonics: 'Tectonique'
    };
    return labels[key];
  }

  getPaleontologicalLabel(key: string): string {
    const labels: { [key: string]: string } = {
      vertebrates: 'Vertébrés',
      invertebrates: 'Invertébrés',
      plants: 'Végétaux',
      traceFossils: 'Traces fossiles',
      other: 'Autres'
    };
    return labels[key];
  }

  exportData() {
    const data = document.getElementById('export-content');
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        const heightLeft = imgHeight;

        const contentDataURL = canvas.toDataURL('image/png');
        let pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
        const position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        pdf.save('site-details.pdf'); // Generated PDF
      });
    }
  }
}
