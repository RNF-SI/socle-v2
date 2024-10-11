import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faArrowUpRightFromSquare, faKey, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { GeologicalInterests } from 'src/app/models/geological-interests.model';
import { Nomenclature } from 'src/app/models/nomenclature.model';
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
  tInfosBaseSiteForm: any;
  faKey = faKey;
  faUserPlus = faUserPlus;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  selectedSite: any = {};   
  substancesOptions: Nomenclature[] = [];


// Correct the type to be a single object instead of an array
 

Applications = [
  {
    'nom': 'Aiguilles Rouges',
    'superficie': '3276.00 ',
    'sitesInpg': '2',
    'autresSitesDeGeopatrimoine': '2',
    'nombreDeStratotypes': '2',
    'terrainsLesPlusAnciens': 'Bathonien',
    'terrainsLesPlusRecents': 'Holocène'
  },
  {
    'nom': 'Anciennes carrières de Cléty',
    'superficie': '2050.00',
    'sitesInpg': '3',
    'autresSitesDeGeopatrimoine': '3',
    'nombreDeStratotypes': '3',
    'terrainsLesPlusAnciens': 'Albien',
    'terrainsLesPlusRecents': 'Holocène'
  },
  {
    'nom': 'Anciennes carrières d\'Orival',
    'superficie': '1506.00',
    'sitesInpg': '4',
    'autresSitesDeGeopatrimoine': '4',
    'nombreDeStratotypes': '4',
    'terrainsLesPlusAnciens': 'Bathonien',
    'terrainsLesPlusRecents': 'Holocène'
  }
];

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
           this.selectedSite = this.Applications.find(app => app.nom === this.site?.nom);
        }
        if (this.site) {
          this.tInfosBaseSiteService.getSiteBySlug(slug).subscribe((data: string) => {
             this.tInfosBaseSite = data;  
             this.geologicalUnits = this.tInfosBaseSite.geologicalUnits || [];  // Assurez-vous que les unités sont bien récupérées
             
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
  

  // TODO : sdfsgfsdf
  setGeologicalHeritages(): void {
    this.principalHeritage = this.patrimoineGeologique?.geologicalHeritages || [];
  }

  setProtectionGeologicalHeritages(): void {
    this.protectionHeritage = this.patrimoineGeologique?.protectionGeologicalHeritages || [];
  }

  

  setPaleontologicalLabels(): void {
    this.paleontologicalLabels = []; // Réinitialiser les labels
  
    // On vérifie si la réponse à la question 5 est "Oui"
    const heritage = this.tInfosBaseSiteForm.get('contains_paleontological_heritage');
  
    if (heritage?.get('answer')?.value === true) { // Vérifie si l'utilisateur a répondu "Oui"
      if (heritage.get('vertebrates')?.value) {
        this.paleontologicalLabels.push('Vertébrés');
      }
      if (heritage.get('invertebrates')?.value) {
        this.paleontologicalLabels.push('Invertébrés');
      }
      if (heritage.get('plants')?.value) {
        this.paleontologicalLabels.push('Végétaux');
      }
      if (heritage.get('traceFossils')?.value) {
        this.paleontologicalLabels.push('Traces fossiles');
      }
      
    }
  
    console.log('Paleontological Labels:', this.paleontologicalLabels);
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

  getSelectedSubstances(): Nomenclature[] {
    const selectedMnemonics = this.tInfosBaseSiteForm.get('substance')?.value || [];
    return this.substancesOptions.filter(substance => selectedMnemonics.includes(substance.mnemonique));
  }
  
  exportData() {
    const data = document.getElementById('export-content');
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;  
        const pageHeight = 295;  
        const imgHeight = (canvas.height * imgWidth) / canvas.width;  
        let heightLeft = imgHeight;
        const contentDataURL = canvas.toDataURL('image/png');
        let pdf = new jsPDF('p', 'mm', 'a4');  
        let position = 0; 
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight; 
          pdf.addPage();
          pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save('site-details.pdf');
      });
    }
  }
  
}

