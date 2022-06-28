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


import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { Injector } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { createCustomElement } from '@angular/elements';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormioHistoryViewerComponent } from './formio-history-viewer/formio-history-viewer.component';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DatePipe } from '@angular/common';
import { StringFilterPipe } from './pipes/string-filter.pipe';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { ModalModule } from 'ngx-bootstrap/modal';
import { FormioModule } from 'angular-formio';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FormioHistoryService } from './formio-history-viewer/formio-history-viewer.service';

@NgModule({
  declarations: [
    AppComponent,
    FormioHistoryViewerComponent,
    StringFilterPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxSpinnerModule,
    FontAwesomeModule,
    BrowserAnimationsModule, // required animations module
    ModalModule.forRoot(),
    FormioModule,
    ToastrModule.forRoot()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  providers: [
    DatePipe,
    FormioHistoryService
  ],
  bootstrap: [], // Build
  //bootstrap: [AppComponent],
  entryComponents: [
    AppComponent,
    FormioHistoryViewerComponent
  ]
})
export class AppModule {
  constructor(private injector: Injector) { }

  ngDoBootstrap() {
    const el = createCustomElement(AppComponent, { injector: this.injector });
    customElements.define('app-assessments-module', el);  // "customelement-selector" is the dom selector that will be used in parent app to render this component

    //you could create more than one element here by repeating above lines for each component, make sure you use unique selectors.
  }
}
