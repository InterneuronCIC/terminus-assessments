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
import { Overlay, ToastrService } from 'ngx-toastr';


@Injectable({
    providedIn: 'root'
})
export class ToasterService {

    constructor(private toastr: ToastrService,) { }

    overlay: Overlay;

    showToaster(toastrClass: string, message: string) {
        switch (toastrClass) {
            case "info":
                this.toastr.info(message);
                break;
            case "success":
                this.toastr.success(message);
                break;
            case "warning":
                this.toastr.warning(message);
                break;
            case "error":
                this.toastr.error(message);
                break;
            default:
                this.toastr.success(message);
        }

    }

}
