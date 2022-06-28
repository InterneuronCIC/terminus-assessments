//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2022  Interneuron CIC

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
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { CoreFormResponse } from '../models/entities/core-form-response.model';
import { ApirequestService } from '../../services/api-request.service';
import { AppService } from '../../services/app.service';
import { FormioForm, FormioOptions } from 'angular-formio';
import { IconsService } from 'src/services/icons.service';

@Component({
  selector: 'app-formio-history-viewer',
  templateUrl: './formio-history-viewer.component.html',
  styleUrls: ['./formio-history-viewer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FormioHistoryViewerComponent implements OnInit {


  @Input() title: string;
  @Input() message: string;
  @Input() btnOkText: string;
  @Input() btnCancelText: string;
  @Input() formContextKey: string;

  getAssessmentHistoryURI: string;

  historyList: CoreFormResponse[];
  historyForm: CoreFormResponse;

  historyView: string;

  generatedForm: FormioForm;

  public formioOptions: FormioOptions = {
    'disableAlerts': true
  };

  //public options: FormioOptions;
  options: Object = {
    submitMessage: "",
    disableAlerts: true,
    noAlerts: true,
    readOnly: true
  }

  submission: any;

    //API Variables
    //globalURL: string = this.appService.baseURI;
    careRecordURL: string = this.appService.moduleConfig.apiEndpoints.careRecordURI;
    terminologyURL: string = this.appService.moduleConfig.apiEndpoints.terminologyURI;
    autonomicURL: string = this.appService.moduleConfig.apiEndpoints.autonomicURI;
    imageServerURL: string = this.appService.moduleConfig.apiEndpoints.imageServerURI;
    bearerAuthToken: string;

  subscriptions: Subscription = new Subscription();

  constructor(private activeModal: NgbActiveModal, 
    public appService: AppService, 
    private apiRequest: ApirequestService, 
    private spinner: NgxSpinnerService,
    public icons: IconsService) { }

  ngOnInit() {
    this.historyView = 'list';
    //this.bearerAuthToken = 'bearer '+ this.appService.apiServiceReference.authService.user.access_token;
    this.getAssessmentHistoryURI = this.appService.moduleConfig.apiEndpoints.getAssessmentHistoryURI + this.formContextKey;
    console.log(this.getAssessmentHistoryURI);
    this.GetFormHistory();
  }

  async GetFormHistory() {
    this.spinner.show("form-history-spinner");
      await this.subscriptions.add(
       this.apiRequest.getRequest(this.getAssessmentHistoryURI)
       .subscribe((response) => {
        var resp = JSON.parse(response);
         this.historyList = resp.reverse();
         this.spinner.hide("form-history-spinner");
       })
     )
  }

  public decline() {
    this.activeModal.close(false);
  }

  public accept() {
    this.activeModal.close(true);
  }

  public dismiss() {
    this.activeModal.dismiss();
  }

   viewHistoryForm(obj: any) {
    this.historyView = 'form';
    this.historyForm = obj;

   //Make readonly
    var resp = [];
    for (const control of JSON.parse(this.historyForm.formcomponents)) {
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
    this.historyForm.formcomponents = JSON.stringify(resp);

    this.generatedForm = {components: JSON.parse(this.historyForm.formcomponents)};

    this.submission = this.buildDataObject();


  }

  dataObjectString: any;
  initialdataObjectString: string;
  dataObject: any;

  buildDataObject() {

    this.dataObject = JSON.parse('{"data":' + this.historyForm.formresponse + '}') ;
    this.dataObject["data"]["configBearerAuthToken"] = this.bearerAuthToken;
    //this.dataObject["data"]["submit"] = false;

    //this.dataObject["data"]["configGlobalURL"] = this.globalURL;
    this.dataObject["data"]["configAutonomicURL"] = this.autonomicURL;
    this.dataObject["data"]["configTerminologyURL"] = this.terminologyURL;
    this.dataObject["data"]["configImageServerURL"] = this.imageServerURL;
    this.dataObject["data"]["configCareRecordURL"] = this.careRecordURL;


    //this.dataObject["data"]["configUserUsername"] =  jwtDecode(this.appService.apiService.authService.user.access_token)["IPUId"];
    //this.dataObject["data"]["configUserDisplayName"] = jwtDecode(this.appService.apiService.authService.user.access_token)["name"];
    //console.log(this.dataObject);

    //delete this.dataObject["data"]["submit"];

    //console.log(this.dataObject);

    return this.dataObject;



  }

  onRender() {
    //console.log('onRender');
  }

  onChange(value: any) {
    //console.log('onChange');
    //console.log(value);
  }

  backToList() {
    this.historyForm = null;
    this.submission = null;
    this.historyView = 'list';
  }


}
