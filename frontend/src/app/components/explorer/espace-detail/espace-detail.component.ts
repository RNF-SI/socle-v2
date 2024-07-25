import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SitesService } from 'src/app/services/sites.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';
import { Site } from 'src/app/models/site.model';
import { GeologicalInterests } from 'src/app/models/geological-interests.model';

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
      console.log('Site:', this.site);
    });

    if (slug) {
      this.tInfosBaseSiteService.getSiteBySlug(slug).subscribe((data: any) => {
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

  exportData(): void {
    const data = [
      ['Nom du site', this.site?.nom],
      ['a- La réserve a-t-elle été créée sur le fondement d’un patrimoine géologique ?', this.tInfosBaseSite?.reserve_created_on_geological_basis ? 'Oui' : 'Non'],
      ['La réserve abrite-t-elle du patrimoine géologique (données INPG) ?', this.tInfosBaseSite?.reserve_contains_geological_heritage_inpg ? 'Oui' : 'Non'],
      ['Liste des sites INPG associés à la RN', this.tInfosBaseSite?.reserve_contains_geological_heritage_other],
      ['Le périmètre de protection de la réserve (hors secteurs classés) abrite-t-il du patrimoine géologique (données INPG) ?', this.tInfosBaseSite?.protection_perimeter_contains_geological_heritage_inpg ? 'Oui' : 'Non'],
      ['Détails', this.tInfosBaseSite?.protection_perimeter_contains_geological_heritage_other],
      ['Quels sont les intérêts géologiques principaux de la réserve ?', this.geologicalInterests.join(', ')],
      ['Est-ce que les terrains de la réserve renferment du patrimoine paléontologique ?', this.tInfosBaseSite?.contains_paleontological_heritage?.answer ? 'Oui' : 'Non'],
      ['Vertébrés', this.tInfosBaseSite?.contains_paleontological_heritage?.vertebrates ? 'Oui' : 'Non'],
      ['Invertébrés', this.tInfosBaseSite?.contains_paleontological_heritage?.invertebrates ? 'Oui' : 'Non'],
      ['Végétaux', this.tInfosBaseSite?.contains_paleontological_heritage?.plants ? 'Oui' : 'Non'],
      ['Traces fossiles', this.tInfosBaseSite?.contains_paleontological_heritage?.traceFossils ? 'Oui' : 'Non'],
      ['Autres', this.tInfosBaseSite?.contains_paleontological_heritage?.other ? 'Oui' : 'Non'],
      ['Préciser', this.tInfosBaseSite?.contains_paleontological_heritage?.otherDetails],
      ['Est-ce que la réserve dispose de collections géologiques propres ?', this.tInfosBaseSite?.reserve_has_geological_collections ? 'Oui' : 'Non'],
      ['Est-ce que la réserve dispose d’un lieu d’exposition de collections géologiques ?', this.tInfosBaseSite?.reserve_has_exhibition ? 'Oui' : 'Non'],
      ['Âge des terrains à l’affleurement dans la réserve', this.tInfosBaseSite?.geological_age],
      ['Étage', this.tInfosBaseSite?.etage],
      ['Ère Période Époque', this.tInfosBaseSite?.ere_periode_epoque],
      ['Est-ce que la réserve (périmètre de protection inclus) abrite un stratotype ?', this.tInfosBaseSite?.reserve_contains_stratotype ? 'Oui' : 'Non'],
      ['Stratotype de limite', this.tInfosBaseSite?.stratotype_details ? 'Oui' : 'Non'],
      ['Préciser', this.tInfosBaseSite?.stratotype_details],
      ['Stratotype d’étage', this.tInfosBaseSite?.stratotype_stage ? 'Oui' : 'Non'],
      ['Préciser', this.tInfosBaseSite?.stratotype_stage_input],
      ['Est-ce que la réserve présente des milieux souterrains abritant un patrimoine naturel identifié, biologique ou géologique (périmètre de protection inclus) ?', this.tInfosBaseSite?.contains_subterranean_habitats ? 'Oui' : 'Non'],
      ['Cavités naturelles', this.tInfosBaseSite?.subterranean_habitats_natural_cavities ? 'Oui' : 'Non'],
      ['Cavités anthropiques', this.tInfosBaseSite?.subterranean_habitats_anthropogenic_cavities ? 'Oui' : 'Non'],
      ['Est-ce que la réserve est associée à une exploitation de ressources minérales ?', this.tInfosBaseSite?.associated_with_mineral_resources ? 'Oui' : 'Non'],
      ['Ancienne carrière', this.tInfosBaseSite?.mineral_resources_old_quarry ? 'Oui' : 'Non'],
      ['Carrière en activité', this.tInfosBaseSite?.mineral_resources_active_quarry ? 'Oui' : 'Non'],
      ['Préciser la substance exploitée', this.tInfosBaseSite?.quarry_extracted_material],
      ['Matériau fossilifère', this.tInfosBaseSite?.quarry_fossiliferous_material ? 'Oui' : 'Non'],
      ['Ancienne mine', this.tInfosBaseSite?.mineral_resources_old_mine ? 'Oui' : 'Non'],
      ['Mine en activité', this.tInfosBaseSite?.mineral_resources_active_mine ? 'Oui' : 'Non'],
      ['Préciser la substance exploitée', this.tInfosBaseSite?.mine_extracted_material],
      ['Matériau fossilifère', this.tInfosBaseSite?.mine_fossiliferous_material ? 'Oui' : 'Non'],
      ['Est-ce que la réserve dispose d’un site géologique aménagé pour les visiteurs ?', this.tInfosBaseSite?.reserve_has_geological_site_for_visitors ? 'Oui' : 'Non'],
      ['Est-ce que la réserve propose des animations sur la thématique géodiversité / patrimoine géologique ?', this.tInfosBaseSite?.offers_geodiversity_activities ? 'Oui' : 'Non']
    ];

    let csvContent = "data:text/csv;charset=utf-8," 
      + data.map(e => e.join(",")).join("\n");

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "site_details.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

