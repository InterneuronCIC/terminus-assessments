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
import { Injectable } from '@angular/core';
import { faSearch, faSort, faGlasses, faHistory, faStar, faUserClock, faUserCheck, faExclamationTriangle, faChartBar, faFilePdf, faPlus, faCheck, faTimes, faArrowLeft, faCheckSquare, faChevronLeft, faArrowRight, faPrint } from '@fortawesome/free-solid-svg-icons';

@Injectable({
    providedIn: 'root'
  })
  export class IconsService {
    public searchIcon = faSearch;
    public sortIcon = faSort;
    public glassesIcon = faGlasses;
    public historyIcon = faHistory;
    public starIcon = faStar;
    public userClockIcon = faUserClock;
    public userCheckIcon = faUserCheck;
    public exclamationTriangleIcon = faExclamationTriangle;
    public chartBarIcon = faChartBar;
    public filePdfIcon = faFilePdf;
    public plusIcon = faPlus;
    public checkIcon = faCheck;
    public timesIcon = faTimes;
    public arrowLeftIcon = faArrowLeft;
    public checkSquareIcon = faCheckSquare;
    public chevronLeftIcon = faChevronLeft;
    public arrowRightIcon = faArrowRight;
    public printIcon = faPrint;
  }