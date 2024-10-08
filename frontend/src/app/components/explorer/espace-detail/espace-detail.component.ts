import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { GeologicalInterests } from 'src/app/models/geological-interests.model';
import { Site } from 'src/app/models/site.model';
import { PatrimoineGeologiqueService } from 'src/app/services/patrimoine-geologique.service';
import { SitesService } from 'src/app/services/sites.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';

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
  geologicalUnitsOptions: string[] = [];
  geologicalUnits: string[] = [];

 

  constructor(
    private route: ActivatedRoute,
    private siteService: SitesService,
    private tInfosBaseSiteService: TInfosBaseSiteService,
    private patrimoineGeologiqueService: PatrimoineGeologiqueService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
 
    if (slug) {
      this.siteService.getSites().subscribe((sites: Site[]) => {
        this.site = sites.find(site => site.slug === slug);
        console.log('Site:', this.site);

        if (this.site) {
          this.tInfosBaseSiteService.getSiteBySlug(slug).subscribe((data: string) => {
             this.tInfosBaseSite = data;  
             this.geologicalUnitsOptions = this.geologicalUnits;
             
             this.setPaleontologicalLabels();


              
          });
        }
        this.fetchPatrimoineGeologique(this.site?.id_site);
      });
    }
 
  }
   

 
  fetchPatrimoineGeologique(siteId: any): void {
    this.patrimoineGeologiqueService.getPatrimoineGeologique(siteId).subscribe(
      (data: any) => {
        console.log('Fetched Geological Heritage Data:', data); // Log pour vérifier les données récupérées
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

  

  setPaleontologicalLabels(): void {
    this.paleontologicalLabels = []; // Réinitialiser les labels
    
    const heritage = this.tInfosBaseSite?.contains_paleontological_heritage;
    console.log('Heritage data:', heritage); // Vérifiez les données récupérées
    
    if (heritage?.answer) {
      if (heritage.vertebrates) {
        this.paleontologicalLabels.push('Fossiles de vertébrés');
      }
      if (heritage.invertebrates) {
        this.paleontologicalLabels.push('Fossiles d\'invertébrés');
      }
      if (heritage.plants) {
        this.paleontologicalLabels.push('Fossiles de végétaux');
      }
      if (heritage.traceFossils) {
        this.paleontologicalLabels.push('Traces fossiles');
      }
      if (heritage.other && heritage.otherDetails) {
        this.paleontologicalLabels.push(`Autres: ${heritage.otherDetails}`);
      }
      console.log('Paleontological Labels:', this.paleontologicalLabels); // Vérifier les labels générés
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

