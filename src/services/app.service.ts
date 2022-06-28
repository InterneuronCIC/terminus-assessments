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
import { Injectable } from '@angular/core';
import { TerminusModuleAssessmentsConfig } from 'src/app/models/config/terminus-module-assessments.model';
import  jwt_decode from "jwt-decode";
import { action } from 'src/app/models/synapse-dynamic-api/Filter.model';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    personId: string;
    encounterId: string;
    contexts: string;
    loggedInUserName: string;
    loggedInUserId: string;
    apiServiceReference: any;
    roleActions: action[] = [];

    moduleConfig: TerminusModuleAssessmentsConfig;

    decodeAccessToken(token: string): any {
        try {
            return jwt_decode(token);
        }
        catch (Error) {
            return null;
        }
    }

    public authoriseAction(action: string): boolean {
      return this.roleActions.filter(x => x.actionname.toLowerCase() == action.toLowerCase()).length > 0;
    }
}