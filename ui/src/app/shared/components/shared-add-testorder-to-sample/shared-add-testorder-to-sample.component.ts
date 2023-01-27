import { Component, Input, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import { flatten, each } from "lodash";
import { Observable, zip } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import {
  loadLabSamplesByCollectionDates,
  loadSampleByUuid,
} from "src/app/store/actions";
import { AppState } from "src/app/store/reducers";
import {
  getLabSampleLoadingState,
  getTestOrdersFromSampleBySampleLabel,
} from "src/app/store/selectors";
import { Dropdown } from "../../modules/form/models/dropdown.model";
import { Field } from "../../modules/form/models/field.model";
import { FormValue } from "../../modules/form/models/form-value.model";
import { ConceptsService } from "../../resources/concepts/services/concepts.service";
import { ICARE_CONFIG } from "../../resources/config";
import { OrdersService } from "../../resources/order/services/orders.service";
import { VisitsService } from "../../resources/visits/services";
import { SamplesService } from "../../services/samples.service";

@Component({
  selector: "app-shared-add-testorder-to-sample",
  templateUrl: "./shared-add-testorder-to-sample.component.html",
  styleUrls: ["./shared-add-testorder-to-sample.component.scss"],
})
export class SharedAddTestorderToSampleComponent implements OnInit {
  @Input() provider: any;
  @Input() visit: any;
  @Input() sample: any;
  @Input() currentUser: any;
  existingOrdersDetails: any;
  formField: Field<string>;
  isFormValid: boolean = false;
  saving: boolean = false;
  valuesToSave: any;
  existingOrdersDetails$: Observable<any>;
  labSampleLoadingState$: Observable<any>;
  constructor(
    private orderService: OrdersService,
    private sampleService: SamplesService,
    private conceptsService: ConceptsService,
    private store: Store<AppState>,
    private visitService: VisitsService
  ) {}

  ngOnInit(): void {
    this.existingOrdersDetails = flatten(
      this.visit?.encounters?.map((encounter) => encounter?.orders)
    );

    this.labSampleLoadingState$ = this.store.select(getLabSampleLoadingState);

    this.existingOrdersDetails$ = this.store.select(
      getTestOrdersFromSampleBySampleLabel(this.sample?.id)
    );
    this.formField = new Dropdown({
      id: "testorders",
      key: "testorders",
      required: true,
      options: [],
      searchControlType: "concept",
      searchTerm: "TEST_ORDERS",
      conceptClass: "Test",
      multiple: true,
      shouldHaveLiveSearchForDropDownFields: true,
    });
  }

  onUpdateForm(formValue: FormValue): void {
    this.valuesToSave = formValue.getValues()?.testorders?.value;
    this.isFormValid = formValue.isValid;
  }

  onSave(event: Event): void {
    event.stopPropagation();
    this.saving = true;
    setTimeout(() => {
      this.saving = true;
    }, 100);
    const encounter = {
      visit: this.sample?.visit?.uuid,
      encounterDatetime: new Date().toISOString(),
      patient: this.existingOrdersDetails[0]?.patient?.uuid,
      encounterType: this.visit?.encounters[0]?.encounterType?.uuid,
      location: JSON.parse(localStorage.getItem("currentLocation"))?.uuid,
      encounterProviders: [
        {
          provider: this.provider?.uuid,
          encounterRole: ICARE_CONFIG?.encounterRole?.uuid,
        },
      ],
      orders: this.valuesToSave?.map((value) => {
        return {
          orderType: this.existingOrdersDetails[0]?.orderType?.uuid,
          action: "NEW",
          urgency: "ROUTINE",
          careSetting: "OUTPATIENT",
          patient: this.existingOrdersDetails[0]?.patient?.uuid,
          concept: value?.uuid,
          orderer: this.provider?.uuid,
          type: "testorder",
        };
      }),
    };

    this.orderService
      .createOrdersViaCreatingEncounter(encounter)
      .subscribe((response) => {
        if (response && !response?.error) {
          zip(
            ...response?.orders.map((order) => {
              const sampleOrder = {
                sample: {
                  uuid: this.sample?.uuid,
                },
                order: {
                  uuid: order?.uuid,
                },
                technician: {
                  uuid: localStorage.getItem("userUuid"),
                },
              };
              return this.sampleService.createSampleOrder(sampleOrder);
            })
          ).subscribe((saveOrderResponse: any) => {
            const orderWithAllocation = this.sample.orders.filter(
              (order) => order?.testAllocations?.length > 0
            )[0];

            if(!saveOrderResponse?.error){
              zip(
                ...saveOrderResponse?.map((responseOrder) => {
                  return this.conceptsService.getConceptDetailsByUuid(
                    responseOrder?.order?.concept?.uuid
                  ).pipe(
                    map((concept) => {
                      let allocations = [];

                      if (concept?.setMembers?.length === 0) {
                        allocations = [
                          ...allocations,
                          {
                            order: {
                              uuid: responseOrder?.order?.uuid,
                            },
                            container: {
                              uuid: orderWithAllocation?.testAllocations[0]
                                ?.container?.uuid,
                            },
                            sample: {
                              uuid: responseOrder?.sample?.uuid,
                            },
                            concept: {
                              uuid: concept.uuid,
                            },
                            label: responseOrder?.order?.orderNumber,
                          },
                        ];
                      } else {
                        each(concept?.setMembers, (setMember) => {
                          allocations = [
                            ...allocations,
                            {
                              order: {
                                uuid: responseOrder?.order?.uuid,
                              },
                              container: {
                                uuid: orderWithAllocation?.testAllocations[0]
                                  ?.container?.uuid,
                              },
                              sample: {
                                uuid: responseOrder?.sample?.uuid,
                              },
                              concept: {
                                uuid: setMember.uuid,
                              },
                              label: responseOrder?.order?.orderNumber,
                            },
                          ];
                        });
                      }

                      const status = {
                        sample: {
                          uuid: orderWithAllocation?.sample?.uuid,
                        },
                        user: {
                          uuid: this.currentUser?.uuid,
                        },
                        remarks: "added test",
                        status: "ADDED_TEST",
                        category: "ADDED_TEST",
                      };

                      let sampleAcceptStatusWithAllocations = {
                        status: status,
                        allocations: allocations,
                      };

                      return sampleAcceptStatusWithAllocations;
                    })
                  );
                })
              ).subscribe(
                  ((conceptResponse: any) => {
                    if(!conceptResponse?.error){
                      zip(
                        ...conceptResponse.map(
                          (sampleAcceptStatusWithAllocations) => {
                            return this.sampleService.acceptSampleAndCreateAllocations(
                              sampleAcceptStatusWithAllocations
                            );
                          }
                        )
                      ).subscribe(
                          (response) => {
                          this.store.dispatch(
                            loadSampleByUuid({ uuid: this.sample?.uuid })
                          );
                        });
                    }
                  })
                );
            }

            this.saving = false;
          });
        }
      });
    // 1. Save order
    // 2. Save sample order
    // 3. Get concept details
    // 4. Set test allocations
  }
}
