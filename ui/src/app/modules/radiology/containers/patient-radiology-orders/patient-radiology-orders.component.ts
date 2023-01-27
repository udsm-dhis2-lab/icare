import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { SystemSettingsService } from "src/app/core/services/system-settings.service";
import { loadCurrentPatient, loadRolesDetails } from "src/app/store/actions";
import { loadPatientBills } from "src/app/store/actions/bill.actions";
import { loadActiveVisit } from "src/app/store/actions/visit.actions";
import { AppState } from "src/app/store/reducers";
import { getAllRadiologyOrders } from "src/app/store/selectors";
import { getCurrentPatient } from "src/app/store/selectors/current-patient.selectors";
import {
  getAllUSerRoles,
  getCurrentUserDetails,
  getCurrentUserPrivileges,
} from "src/app/store/selectors/current-user.selectors";
import { getActiveVisitUuid } from "src/app/store/selectors/visit.selectors";

@Component({
  selector: "app-patient-radiology-orders",
  templateUrl: "./patient-radiology-orders.component.html",
  styleUrls: ["./patient-radiology-orders.component.scss"],
})
export class PatientRadiologyOrdersComponent implements OnInit {
  privilegesConfigs$: Observable<any>;
  formPrivilegesConfigsLoadingState$: Observable<boolean>;
  currentUser$: Observable<any>;
  allUserRoles$: Observable<any[]>;
  userPrivileges$: Observable<any>;

  orders$: Observable<any>;
  patientId: string;

  activeVisitUuid$: Observable<string>;
  currentPatient$: Observable<any>;
  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private systemSettingsService: SystemSettingsService
  ) {
    this.store.dispatch(loadRolesDetails());
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.params["patientId"];
    this.store.dispatch(
      loadPatientBills({
        patientUuid: this.patientId,
        isRegistrationPage: true,
      })
    );
    this.store.dispatch(loadActiveVisit({ patientId: this.patientId }));
    this.store.dispatch(loadCurrentPatient({ uuid: this.patientId }));
    this.store.dispatch(loadPatientBills({ patientUuid: this.patientId }));
    this.allUserRoles$ = this.store.select(getAllUSerRoles);
    this.userPrivileges$ = this.store.select(getCurrentUserPrivileges);
    this.currentUser$ = this.store.select(getCurrentUserDetails);
    this.orders$ = this.store.select(getAllRadiologyOrders);
    this.activeVisitUuid$ = this.store.select(getActiveVisitUuid);
    this.currentPatient$ = this.store.select(getCurrentPatient);
  }
}
