import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { modules } from "./modules";
import { materialModules } from "./material-modules";
import { components, sharedEntryComponents } from "./components";
import { sharedPipes } from "./pipes";
import { FormModule } from "./modules/form/form.module";
import { sharedDialogs } from "./dialogs";
import { sharedServices } from "./services";
import { FilterFormsByServiceProvidedPipe } from "./pipes/filter-forms-by-service-provided.pipe";
import { FilterFormsByLocationPipe } from "./pipes/filter-forms-by-location.pipe";
import { FilterServicesConceptPipe } from "./pipes/filter-services-concept.pipe";
import { FormatIsoStrDateForDisplayPipe } from "./pipes/format-iso-str-date-for-display.pipe";
import { FilterDiagnosesPipe } from "./pipes/filter-diagnoses.pipe";
import { FilterItemsBySelectionsPipe } from "./pipes/filter-items-by-selections.pipe";
import { HttpClientModule } from "@angular/common/http";
import { SearchTestDetailsPipe } from './pipes/search-test-details.pipe';
import { SharedVitalSignsComponent } from './components/shared-vital-signs/shared-vital-signs.component';
import { VitalSignsComponent } from './components/vital-signs/vital-signs.component';
@NgModule({
    imports: [CommonModule, ...materialModules, ...modules],
    exports: [
        CommonModule,
        FormModule,
        ...materialModules,
        ...modules,
        ...components,
        ...sharedPipes,
        ...sharedDialogs,
        HttpClientModule,
    ],
    declarations: [
        ...components,
        ...sharedDialogs,
        ...sharedPipes,
        FilterFormsByServiceProvidedPipe,
        FilterFormsByLocationPipe,
        FilterServicesConceptPipe,
        FormatIsoStrDateForDisplayPipe,
        FilterDiagnosesPipe,
        FilterItemsBySelectionsPipe,
        SearchTestDetailsPipe,
        SharedVitalSignsComponent,
        VitalSignsComponent,
    ],
    providers: [...sharedServices]
})
export class SharedModule {}
