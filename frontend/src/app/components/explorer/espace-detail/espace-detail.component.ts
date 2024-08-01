import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SitesService } from 'src/app/services/sites.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';
import { Site } from 'src/app/models/site.model';
import { GeologicalInterests } from 'src/app/models/geological-interests.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-espace-detail',
  templateUrl: './espace-detail.component.html',
  styleUrls: ['./espace-detail.component.scss']
})
export class EspaceDetailComponent implements OnInit {
  site: Site | undefined;
  tInfosBaseSite: any;
  geologicalInterests: string[] = [];
  paleontologicalLabels: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private siteService: SitesService,
    private tInfosBaseSiteService: TInfosBaseSiteService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    console.log('Slug:', slug);
    this.siteService.getSites().subscribe((data: Site[]) => {
      this.site = data.find(site => site.slug === slug);
       
    });

    if (slug) {
      this.siteService.getSiteBySlug(slug).subscribe((data: any) => {
        this.tInfosBaseSite = data;
        console.log('tInfosBaseSite:', this.tInfosBaseSite);
        this.setGeologicalInterests();
        this.setPaleontologicalLabels();
      });
    }
  }

  setPaleontologicalLabels(): void {
    console.log('contains_paleontological_heritage:', this.tInfosBaseSite?.contains_paleontological_heritage);

    if (this.tInfosBaseSite?.contains_paleontological_heritage) {
      if (this.tInfosBaseSite.contains_paleontological_heritage_vertebrates) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('vertebrates'));
      }
      if (this.tInfosBaseSite.contains_paleontological_heritage_invertebrates) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('invertebrates'));
      }
      if (this.tInfosBaseSite.contains_paleontological_heritage_plants) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('plants'));
      }
      if (this.tInfosBaseSite.contains_paleontological_heritage_trace_fossils) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('traceFossils'));
      }
      if (this.tInfosBaseSite.contains_paleontological_heritage_other) {
        this.paleontologicalLabels.push(this.getPaleontologicalLabel('other'));
        if (this.tInfosBaseSite.contains_paleontological_heritage_other_details) {
          this.paleontologicalLabels.push(`Préciser : ${this.tInfosBaseSite.contains_paleontological_heritage_other_details}`);
        }
      }
    }
    console.log('PaleontologicalLabels:', this.paleontologicalLabels);
  }

  setGeologicalInterests(): void {
    const interests: GeologicalInterests = {
      stratigraphic: this.tInfosBaseSite?.main_geological_interests_stratigraphic,
      paleontological: this.tInfosBaseSite?.main_geological_interests_paleontological,
      sedimentological: this.tInfosBaseSite?.main_geological_interests_sedimentological,
      geomorphological: this.tInfosBaseSite?.main_geological_interests_geomorphological,
      mineral_resource: this.tInfosBaseSite?.main_geological_interests_mineral_resource,
      mineralogical: this.tInfosBaseSite?.main_geological_interests_mineralogical,
      metamorphism: this.tInfosBaseSite?.main_geological_interests_metamorphism,
      volcanism: this.tInfosBaseSite?.main_geological_interests_volcanism,
      plutonism: this.tInfosBaseSite?.main_geological_interests_plutonism,
      hydrogeology: this.tInfosBaseSite?.main_geological_interests_hydrogeology,
      tectonics: this.tInfosBaseSite?.main_geological_interests_tectonics
    };

    this.geologicalInterests = (Object.keys(interests) as (keyof GeologicalInterests)[])
      .filter(key => interests[key])
      .map(key => this.getInterestLabel(key));
    console.log('GeologicalInterests:', this.geologicalInterests);
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