//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2021  Interneuron CIC

//This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.

//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

//See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program.If not, see<http://www.gnu.org/licenses/>.
//END LICENSE BLOCK 


import { Component, OnDestroy, Input, ElementRef, ViewChild, OnInit, EventEmitter } from '@angular/core';
import { Subscription, Subject } from 'rxjs';

import { ErrorHandlerService } from '../services/error-handler-service.service';
import { ModuleObservablesService } from '../services/module-observables.service';
import { ApirequestService } from '../services/api-request.service';
import { IconsService } from 'src/services/icons.service';
import { saveAs } from 'file-saver';
import { AppService } from 'src/services/app.service';
import { isArray } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { sortByProperty } from './utilities/sort-by-property.utility';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { CoreFormResponse } from './models/entities/core-form-response.model';
import { ToasterService } from 'src/services/toaster-service.service';
import { MetaFormBuilderForm } from './models/entities/meta-form-builder-form.model';
import { FormGroup, NgForm } from '@angular/forms';
import { FormioHistoryService } from './formio-history-viewer/formio-history-viewer.service';
import { action, filter, filterparam, filterParams, filters, orderbystatement, selectstatement } from './models/synapse-dynamic-api/Filter.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  title = "Assessments Module";

  private subscriptions: Subscription = new Subscription();

  // Variables for page loading functionality
  isLoading: boolean = false;
  isPrinting: boolean = false;
  isDocumentDownloaded: boolean = true;
  showForm: boolean = false;
  isAddEditMode: boolean = false;
  showVersionWarning: boolean = false;
  
  // Variables for load more functionality
  noOfRecordsToLoad: number;
  totalAssessmentCount: number;

  // Variables for filter functionality
  assessmentTypes: MetaFormBuilderForm[] = [];
  filter: string = "";
  sortDirection: number = -1; // 1 = ASC; -1 = DESC

  // Variables to load all assessments for a patient
  allAssessments: CoreFormResponse[] = [];
  filteredAssessments: CoreFormResponse[] = [];

  // variables for adding / viewing / editing an assessment
  popupHeader: string = "";
  selectedAssessment: MetaFormBuilderForm = null;
  modalPatientBannerData: any = [];

  // API variables
  bearerAuthToken: string;
  //globalURL: string = this.appService.mod.baseURI;

  //FormIO
  submission: any;
  generatedForm: any;  
  formOptions: Object = {
    submitMessage: "",
    disableAlerts: true,
    noAlerts: true,
    readOnly: true
  };
  formResponse: CoreFormResponse;
  triggerRefresh: EventEmitter<unknown>;
  dataObject: any;
  
  // Variables to control form elements
  @ViewChild("confirmDeleteModal", {static: false}) confirmDeleteModal: ModalDirective;
  @ViewChild("pdfBodyDiv", {static: false}) divPdfBody: ElementRef;
  @ViewChild("resetDeleteFormButton", {static: false}) resetDeleteFormButton: ElementRef;
  @ViewChild("deleteForm", {static: false}) deleteForm: FormGroup;

  assessmentToDelete: CoreFormResponse = new CoreFormResponse();
  isAssessmentTypeSelected: boolean = false;
  currentFormVersion: number;

  //constructor
  constructor(private appService: AppService,
    private apiRequestService: ApirequestService,
    private errorHandlerService: ErrorHandlerService,
    private moduleObservables: ModuleObservablesService,
    public icons: IconsService,
    private toasterService: ToasterService,
    private formioHistoryService: FormioHistoryService) {
    this.subscribeEvents();
  }

  @Input() set datacontract(value: any) {
    this.initAppService(value);
  }

  async initAppService(value: any) {
    // Initialise AppService
    this.appService.apiServiceReference = value.apiService;
    this.moduleObservables.unload = value.unload;
    this.appService.contexts = value.contexts;
    this.appService.personId = value.personId;

    //Initialise logged-in user name
    let decodedToken: any;
    this.bearerAuthToken = this.appService.apiServiceReference.authService.user.access_token;
    if (!this.appService.loggedInUserName) {
      decodedToken = this.appService.decodeAccessToken(this.bearerAuthToken);
      if (decodedToken != null) {
        this.appService.loggedInUserName = decodedToken.name ? (isArray(decodedToken.name) ? decodedToken.name[0] : decodedToken.name) : decodedToken.IPUId;
        this.appService.loggedInUserId = decodedToken.IPUId;
      }
    }

    //this.appService.loggedInUserId = "indiwar@interneuron.org";

    // Initialise module configuration file
    if (!this.appService.moduleConfig) {
      this.subscriptions.add(
        this.apiRequestService.getRequest("./assets/config/terminus-module-assessments.json?v=" + Math.random()).subscribe(
          (response) => {
            this.appService.moduleConfig = response;
            
            //get actions for rbac
            this.subscriptions.add(this.apiRequestService.postRequest(this.appService.moduleConfig.apiEndpoints.getRBACActionsUri, this.createRoleFilter(decodedToken))
            .subscribe((response: action[]) => {
              this.appService.roleActions = response;
            }));

            this.moduleObservables.contextChanged.next();
          }
        )
      );
    }
    else {
      this.moduleObservables.contextChanged.next();
    }
  }

  async ngOnInit() {
    // var value: any = {};
    // value.contexts = JSON.parse("[{\"encounter_id\": \"4123ba14-0cc1-4751-aab9-26dd978baffe\", \"person_id\": \"024b806d-5dd2-449b-8370-427da60fd00b\"}]");
    // value.personId = "024b806d-5dd2-449b-8370-427da60fd00b"; //ALLEN, Catherine

    // this.appService.personId = "024b806d-5dd2-449b-8370-427da60fd00b";
    // this.appService.contexts = value.contexts;

    // value.apiService = {};
    // value.apiService.authService = {};
    // value.apiService.authService.user = {};
    // let auth = this.apiRequestService.authService;
    // auth.getToken().then(async (token) => {
    //   value.apiService.authService.user.access_token = token;
    //   await this.initAppService(value);
    // });
  }

  // Subscribe to observables
  subscribeEvents() {
    this.subscriptions.add(
      this.moduleObservables.contextChanged.subscribe(
        async () => {
          //this.noOfRecordsToLoad = this.appService.moduleConfig.siteSettings.noOfRecordsToDisplay;
          this.getAssessmentTypes();
        },
        error => this.errorHandlerService.handleError(error)
      ));
  }

  fetchModalPatientBannerData(personId) {
    this.subscriptions.add(
      this.apiRequestService.getRequest(this.appService.moduleConfig.apiEndpoints.personDataForModalBannerUrl + personId)
        .subscribe(
          (response: string) => {
            this.modalPatientBannerData = JSON.parse(response)[0];
          }));
  }

  // getAllAssessmentCount() {
  //   this.subscriptions.add(
  //     this.apiRequestService.getRequest(this.appService.moduleConfig.apiEndpoints.patientAssessmentCountUrl +
  //       this.appService.personId).subscribe(
  //         (response: any) => {
  //           let data = JSON.parse(response);
  //           if (data.length > 0) {
  //             this.totalAssessmentCount = data[0].totalAssessmentCount;
  //           }
  //         }
  //       )
  //   );
  // }

  // onLoadMore() {
  //   this.noOfRecordsToLoad = this.noOfRecordsToLoad + this.appService.moduleConfig.siteSettings.noOfRecordsToDisplay;
  //   this.fetchallAssessments();
  // }

  async getAssessmentTypes() {
    this.isLoading = true;
    var payload: any = [
      {
        "filters": [{
          "filterClause": "(formbuilderform_id in (" + this.appService.moduleConfig.siteSettings.formIds + "))"
        }]
      },
      {
        "filterparams": []
      },
      {
        "selectstatement": "SELECT *"
      },
      {
        "ordergroupbystatement": "ORDER BY formname DESC "// Limit " + this.noOfRecordsToLoad
      }
    ];

    this.subscriptions.add(
      this.apiRequestService.postRequest(this.appService.moduleConfig.apiEndpoints.assessmentTypesUrl, payload)
        .subscribe(
          (response: MetaFormBuilderForm[]) => {
            this.assessmentTypes = response;
            if (this.assessmentTypes.length > 0) {
              //this.selectedAssessment = this.assessmentTypes[0];
            }

            // Code to disable Completed By Field

            this.assessmentTypes.map(assessment => {
              let formComponents: any[] = JSON.parse(assessment.formcomponents);

              formComponents.map(comp => {
                if (comp.components) {
                  comp.components.map(component => {
                    if (component.key == "completedByName") {
                      component.disabled = true;
                    }
                  });
                }
              });

              assessment.formcomponents = JSON.stringify(formComponents);
            });
            
            this.fetchallAssessments();
            //this.onSelectAll();
          }));
  }

  async fetchallAssessments() {
    this.isLoading = true;
    var payload: any = [
      {
        "filters": [{
          "filterClause": "(person_id = @personId) AND ((responsestatus = 'submitted' OR responsestatus = 'Deleted') OR (responsestatus = 'draft' AND _createdby = @createdBy))"
        }]
      },
      {
        "filterparams": [
          {
            "paramName": "personId",
            "paramValue": this.appService.personId
          },
          {
            "paramName": "createdBy",
            "paramValue": this.appService.loggedInUserId
          }
        ]
      },
      {
        "selectstatement": "SELECT *"
      },
      {
        "ordergroupbystatement": "ORDER BY _createddate DESC Limit " + this.noOfRecordsToLoad
      }
    ];

    this.subscriptions.add(
      this.apiRequestService.postRequest(this.appService.moduleConfig.apiEndpoints.patientAssessmentsUrl, payload)
      .subscribe(
        async (response: any) => {
          this.allAssessments = response;

          if(this.allAssessments.length > 0) {
            this.allAssessments.map(a => {
              let assessmentType = this.assessmentTypes.find(x => x.formbuilderform_id == a.formbuilderform_id);
              if(assessmentType) {
                a.formname = assessmentType.formname;
              }

              //remove system properties

              delete a._contextkey;
              delete a._createdmessageid;
              delete a._createdsource;
              delete a._recordstatus;
              delete a._row_id;
              delete a._sequenceid;
              delete a._tenant;
              delete a._timezonename;
              delete a._timezoneoffset;

              // Code to disable Completed By Field
              
              let formComponents: any[] = JSON.parse(a.formcomponents);              

              formComponents.map(comp => {
                if (comp.components) {
                  comp.components.map(component => {
                    if (component.key == "completedByName") {
                      component.disabled = true;
                    }
                  });
                }
              });              

              a.formcomponents = JSON.stringify(formComponents);
            });

            this.filteredAssessments = this.allAssessments;

            this.sortDirection = -1;
            this.sortAssessment("_createddate");
          }

          this.isLoading = false;
        }
      )
    );
  }

  /*************** Filter Functionality ***************/

  // getSelectedOptions() {
  //   return this.assessmentTypes
  //     .filter(opt => opt.checked)
  //     .map(opt => opt.category)
  // }

  // filterAssessments() {
  //   let selectedOptions = this.getSelectedOptions();

  //   this.filteredAssessments = this.allAssessments.filter(function (el) {
  //     return selectedOptions.indexOf(el.category) != -1;
  //   });
  // }

  // onSelectAll() {
  //   this.assessmentTypes.forEach((option) => {
  //     option.dataCount = this.allAssessments.filter((fl) => {
  //       return fl.category == option.category;
  //     }).length;
  //     option.checked = option.dataCount > 0;
  //     option.disabled = option.dataCount == 0;
  //   });

  //   this.filterAssessments();
  // }

  // onSelectNone() {
  //   this.assessmentTypes.forEach(function (a) {
  //     a.checked = false;
  //   });

  //   this.filterAssessments();
  // }

  // onCheckboxChanged() {
  //   this.filterAssessments();
  // }

  /*************** Sort Functionality ***************/ 

  sortAssessment(propertyName) {
    this.filteredAssessments.sort(sortByProperty(propertyName, this.sortDirection));

    this.sortDirection = -1 * this.sortDirection; // 1 = ASC, -1 = DESC
  }

  /*************** Form Events ***************/

  onAssessmentTypeChange() {
    this.isAssessmentTypeSelected = this.selectedAssessment == null;
  }

  async buildDataObject() {

    this.dataObject = JSON.parse('{"data":' + this.formResponse.formresponse + '}') ;
    this.dataObject["data"]["configBearerAuthToken"] = this.bearerAuthToken;
    
    this.dataObject["data"]["configGlobalURL"] = this.appService.moduleConfig.apiEndpoints.dynamicApiURI;
    this.dataObject["data"]["configTerminologyURL"] = this.appService.moduleConfig.apiEndpoints.terminologyURI;
    this.dataObject["data"]["configImageServerURL"] = this.appService.moduleConfig.apiEndpoints.imageServerURI;
    this.dataObject["data"]["configCareRecordURL"] = this.appService.moduleConfig.apiEndpoints.careRecordURI;
    this.dataObject["data"]["configPersonId"] = this.appService.personId;
    this.dataObject["data"]["configDynamicApiUrl"] = this.appService.moduleConfig.apiEndpoints.dynamicApiURI;

    this.dataObject["data"]["configUserUsername"] =  this.appService.loggedInUserId;
    this.dataObject["data"]["configUserDisplayName"] = this.appService.loggedInUserName;

    this.dataObject["data"]["configUserDisplayName"] = this.appService.loggedInUserName;


    delete this.dataObject["data"]["submit"];

    return this.dataObject;
  }

  async onAddAssessment() {

    if (this.selectedAssessment != null) {

      this.formResponse = new CoreFormResponse();
      this.formResponse.formbuilderresponse_id = uuidv4();
      this.formResponse.formversion = this.selectedAssessment.version;
      this.formResponse.formcomponents = this.selectedAssessment.formcomponents;
      this.formResponse.formversion = this.selectedAssessment.version;
      this.formResponse.responseversion = 0;
      this.formResponse.responsestatus = "New";
      this.formResponse.formresponse = '{"new":"new"}';
      this.formResponse.person_id = this.appService.personId;
      this.formResponse.formbuilderform_id = this.selectedAssessment.formbuilderform_id;
      this.formResponse.formname = this.selectedAssessment.formname;

      this.submission = await this.buildDataObject();

      // Prepopulate values
      
      let latestPlateletResult = await this.apiRequestService.getRequest(this.appService.moduleConfig.apiEndpoints.latestPlateletCountUri + this.appService.personId).toPromise();
      latestPlateletResult = JSON.parse(latestPlateletResult);
      //latestPlateletResult.observationvaluenumeric = 49;

      let latestBMI = await this.apiRequestService.getRequest(this.appService.moduleConfig.apiEndpoints.latestBmiUri + this.appService.personId).toPromise();
      latestBMI = JSON.parse(latestBMI);    
      //latestBMI.observationvaluenumeric = 31;

      let latestCancerRecord = await this.apiRequestService.getRequest(this.appService.moduleConfig.apiEndpoints.latestCancerRecordUri + this.appService.personId).toPromise();
      latestCancerRecord = JSON.parse(latestCancerRecord);
      //latestCancerRecord.observationvalue = true;

      // Initialise platelet checkbox
      if (latestPlateletResult.result_id && latestPlateletResult.observationvaluenumeric) {
        //VTE Assessment
        if (this.selectedAssessment.formbuilderform_id == "6a898df4-b11a-399a-07e6-883d823cb4b2") {
          if (latestPlateletResult.observationvaluenumeric < 50) {
            if (!this.submission["data"]["contraIndicationsLMWH"]) {
              this.submission["data"]["contraIndicationsLMWH"] = {};
            }
            this.submission["data"]["contraIndicationsLMWH"]["platelets50X109L"] = true;
          }
          if (latestPlateletResult.observationvaluenumeric < 75) {
            if (!this.submission["data"]["patientRelatedBleedingRisk"]) {
              this.submission["data"]["patientRelatedBleedingRisk"] = {};
            }
            this.submission["data"]["patientRelatedBleedingRisk"]["platelets75X109L"] = true;
          }
          if (latestPlateletResult.observationvaluenumeric < 100) {
            if (!this.submission["data"]["contraIndicationsAspirin"]) {
              this.submission["data"]["contraIndicationsAspirin"] = {};
            }
            this.submission["data"]["contraIndicationsAspirin"]["platelets100X109L"] = true;          
          }
        }
        //Adolescents VTE form
        else if(this.selectedAssessment.formbuilderform_id == "ff09f5bd-67ed-4be2-30c1-9e8be4bfcb9b") {
          if (latestPlateletResult.observationvaluenumeric < 75) {
            if (!this.submission["data"]["patientRelatedBleedingRisk"]) {
              this.submission["data"]["patientRelatedBleedingRisk"] = {};
            }
            this.submission["data"]["patientRelatedBleedingRisk"]["thrombocytopeniaPlatelets75X10"] = true;
          }
        }
        // Reassessments
        else if (this.selectedAssessment.formbuilderform_id == "032fcd09-6979-14f8-4a80-91cb1a94390d" ||
          this.selectedAssessment.formbuilderform_id == "db5a7a0a-3394-6f44-3ed6-df0db7388ca3") {
          if (latestPlateletResult.observationvaluenumeric < 100) {
            if (!this.submission["data"]["bleedingRisks"]) {
              this.submission["data"]["bleedingRisks"] = {};
            }
            this.submission["data"]["bleedingRisks"]["plateletCount100X109L"] = true;          
          } 
        }
      }

      // Initialise BMI checkboxes
      if (latestBMI.result_id && latestBMI.observationvaluenumeric) {
        if (this.selectedAssessment.formbuilderform_id == "6a898df4-b11a-399a-07e6-883d823cb4b2") {
          if (latestBMI.observationvaluenumeric > 30) {
            if (!this.submission["data"]["patientRelatedThrombosisRisk"]) {
              this.submission["data"]["patientRelatedThrombosisRisk"] = {};
            }
            this.submission["data"]["patientRelatedThrombosisRisk"]["obesityBmi30KgM"] = true;
          }
        }
      }

      // Initialise Cancer History Check
      if (latestCancerRecord.result_id && latestCancerRecord.observationvalue && latestCancerRecord.observationvalue == true) {
        if (this.selectedAssessment.formbuilderform_id == "6a898df4-b11a-399a-07e6-883d823cb4b2") {
          if (!this.submission["data"]["patientRelatedThrombosisRisk"]) {
            this.submission["data"]["patientRelatedThrombosisRisk"] = {};
          }
          this.submission["data"]["patientRelatedThrombosisRisk"]["activeCancerOrCancerTreatmentChemoRadioWithinLast6Months"] = true;
          
          if (!this.submission["data"]["contraIndicationsAspirin"]) {
            this.submission["data"]["contraIndicationsAspirin"] = {};
          }
          this.submission["data"]["contraIndicationsAspirin"]["activeOrMetastaticCancer"] = true;
        }
        else if (this.selectedAssessment.formbuilderform_id == "ff09f5bd-67ed-4be2-30c1-9e8be4bfcb9b") {
          if (!this.submission["data"]["patientRelatedThrombosisRisk"]) {
            this.submission["data"]["patientRelatedThrombosisRisk"] = {};
          }
          this.submission["data"]["patientRelatedThrombosisRisk"]["activeCancerOrCancerTreatment"] = true;
        }
      }

      this.submission["data"]["completedByName"] = this.appService.loggedInUserId;

      

      this.generatedForm =  {
        title: this.selectedAssessment.formname,
        components: JSON.parse(this.selectedAssessment.formcomponents)
      };

      this.showForm = true;

      this.isAddEditMode = true;

      this.showVersionWarning = false;
        
    }
    else {
      this.isAssessmentTypeSelected = true;
    }
  }

  async onViewAssessment(assessment: CoreFormResponse) {
    console.log(assessment);
    this.isAddEditMode = false;

    this.formResponse = assessment;
        
    // Disable components
    var resp = [];
    for (const control of JSON.parse(this.formResponse.formcomponents)) {
      if (control.key == 'submit' || control.key == 'saveAsDraft') {
        control.hidden = true;
      }
      else if(control.type == "table") {
        for (const row of control.rows) {
          for (const item of row) {
            for (const component of item.components) {
              component.disabled = true;
            }
          }
        }
      }
      else {
        control.disabled = true;
      }
      resp.push(control);
    }
    this.formResponse.formcomponents = JSON.stringify(resp);

    this.generatedForm = {
      title: this.formResponse.formname,
      components: JSON.parse(this.formResponse.formcomponents)
    };
    
    this.submission = await this.buildDataObject();

    this.showForm = true;

    // Version conflict check
    let currentAssessmentForm = this.assessmentTypes.find(x => x.formbuilderform_id == this.formResponse.formbuilderform_id);
    
    if (currentAssessmentForm && currentAssessmentForm.version != this.formResponse.formversion) {
      this.showVersionWarning = true;
      this.currentFormVersion = currentAssessmentForm.version;
    }
    else {
      this.showVersionWarning = false;
    }
  }

  async onEditAssessment(assessment: CoreFormResponse) {
    this.isAddEditMode = true;
    this.formResponse = assessment;

    // Enable components
    var resp = [];
    for (const control of JSON.parse(this.formResponse.formcomponents)) {
      if (control.key == 'submit' || control.key == 'saveAsDraft') {
        control.hidden = false;
      }
      else if(control.type == "table") {
        for (const row of control.rows) {
          for (const item of row) {
            for (const component of item.components) {
              component.disabled = false;
            }
          }
        }
      }
      else {
        control.disabled = false;
      }
      resp.push(control);
    }
    this.formResponse.formcomponents = JSON.stringify(resp);

    this.generatedForm = {
      title: assessment.formname,
      components: JSON.parse(assessment.formcomponents)
    };

    this.submission = await this.buildDataObject();

    this.submission["data"]["completedByName"] = this.appService.loggedInUserId;
    this.submission["data"]["completedDate"] = new Date();    

    this.showForm = true;

    // Version conflict check
    let currentAssessmentForm = this.assessmentTypes.find(x => x.formbuilderform_id == this.formResponse.formbuilderform_id);
    
    if (currentAssessmentForm && currentAssessmentForm.version != this.formResponse.formversion) {
      this.showVersionWarning = true;
      this.currentFormVersion = currentAssessmentForm.version;
    }
    else {
      this.showVersionWarning = false;
    }
  }

  onConfirmDeleteAssessment(assessment: CoreFormResponse) {
    this.assessmentToDelete = assessment;
    this.confirmDeleteModal.show();
  }

  onDeleteAssessment() {
    this.isLoading = true;
    const deleteionDate: any = new Date();
    this.confirmDeleteModal.hide();
    this.assessmentToDelete.responsestatus = "Deleted";
    this.assessmentToDelete._createddate = deleteionDate.toJSON().substr(0, 19);

    delete this.assessmentToDelete.formname;
    
    this.subscriptions.add(
      this.apiRequestService.postRequest(this.appService.moduleConfig.apiEndpoints.formBuilderResponsePostUrl, this.assessmentToDelete)
      .subscribe(async (response) => {
        this.assessmentToDelete = new CoreFormResponse();
        await this.fetchallAssessments();
        this.resetDeleteForm();
    }));
  }

  onViewAsPDF() {
    this.isPrinting = true;
    this.isDocumentDownloaded = false;
    var mediaType = 'application/pdf';

    setTimeout(() => {
      let pdfDocBody: any = {
        "pdfBodyHTML": this.divPdfBody.nativeElement.innerHTML,
        "pdfCssUrl": this.appService.moduleConfig.siteSettings.pdfCssUrl,
        "pdfFooterHTML": "<div class=\"page-footer\" style=\"width:100%; text-align:right; font-size:6px; margin-right:10px\">Page <span class=\"pageNumber\"></span> of <span class=\"totalPages\"></span></div>"
      };

      this.subscriptions.add(
        this.apiRequestService.getDocumentByPost(this.appService.moduleConfig.apiEndpoints.generatePdfDocumentUrl, pdfDocBody)
          .subscribe(
            (response) => {
              var blob = new Blob([response], { type: mediaType });
              saveAs(blob, this.popupHeader + ".pdf");
              this.isDocumentDownloaded = true;
              this.isPrinting = false;
            },
            error => {
              this.isDocumentDownloaded = true;
              this.errorHandlerService.handleError(error);
              this.isPrinting = false;
            }
          )
      );
    }, 1000);
  }

  onCloseModal() {
    this.popupHeader = "";
    this.fetchallAssessments();
  }

  onSubmit(submission: any) {
    console.log(submission);
    //Delete default placeholder if present
    delete submission["data"]["new"];
    //Delete the configBearerAuthToken for the submission
    delete submission["data"]["configBearerAuthToken"];
    //Delete the configGlobalURL for the submission
    delete submission["data"]["configGlobalURL"];
    //Delete the configUserUsername for the submission
    delete submission["data"]["configUserUsername"];
    //Delete the configUserDisplayName for the submission
    delete submission["data"]["configUserDisplayName"];
    //Delete the submit for the submission
    delete submission["data"]["submit"];
    //Delete personId confg
    delete submission["data"]["configPersonId"];

    this.formResponse.formresponse = JSON.stringify(submission["data"]);
    this.formResponse.responsemeta = JSON.stringify(submission["metadata"]);
    
    if (this.formResponse.responsestatus == "New") {
      this.formResponse.createddatetime = submission["data"]["completedDate"].substr(0, 19);;
      this.formResponse.createdby = this.appService.loggedInUserName;
    }
    this.formResponse.lastupdateddatetime = submission["data"]["completedDate"].substr(0, 19);;
    this.formResponse.updatedby = this.appService.loggedInUserId;

    this.formResponse.responsestatus = submission.state;

    this.formResponse.responseversion = (submission.state == "draft" ? this.formResponse.responseversion : this.formResponse.responseversion + 1);

    delete this.formResponse.formname;

    this.formResponse._createddate = submission["data"]["completedDate"] == "" ? null : submission["data"]["completedDate"].substr(0, 19);
    this.formResponse._createdby = this.appService.loggedInUserId;


    this.subscriptions.add(
      this.apiRequestService.postRequest(this.appService.moduleConfig.apiEndpoints.formBuilderResponsePostUrl, this.formResponse)
      .subscribe((response) => {

        this.toasterService.showToaster("Success","Assessment Saved " + (submission.state == "draft" ? "as draft": ""));

        this.fetchallAssessments();

        this.showForm = false;
        this.isAddEditMode = false;
      }
    ));
  }

  onRender() {
  }

  onChange(value: any) {
  }

  onCancel() {
    this.generatedForm = null;
    this.showForm = false;
    this.isAddEditMode = false;
  }

  async onViewHistory() {
    var response = false;
    await this.formioHistoryService.confirm(this.formResponse.formbuilderresponse_id, this.formResponse.formname)
    .then((confirmed) => response = confirmed)
    .catch(() => response = false);
    if(!response) {
      return;
    }
  }

  resetDeleteForm() {
    this.resetDeleteFormButton.nativeElement.click();
  }


  createRoleFilter(decodedToken: any) {
    let condition = "";
    let pm = new filterParams();
    let synapseroles;
    if (this.appService.moduleConfig.siteSettings.prodbuild)
      synapseroles = decodedToken.SynapseRoles
    else
      synapseroles = decodedToken.client_SynapseRoles
    if (!isArray(synapseroles)) {
      condition = "rolename = @rolename";
      pm.filterparams.push(new filterparam("rolename", synapseroles));
    }
    else
      for (var i = 0; i < synapseroles.length; i++) {
        condition += "or rolename = @rolename" + i + " ";
        pm.filterparams.push(new filterparam("rolename" + i, synapseroles[i]));
      }
    condition = condition.replace(/^\or+|\or+$/g, '');
    let f = new filters();
    f.filters.push(new filter(condition));


    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);
    
    return JSON.stringify(body);
  }

  // Inherited methods
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.moduleObservables.unload.next("app-assessments-module");
  }
}
