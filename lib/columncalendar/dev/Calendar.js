/* exported Calendar */
class Calendar {
  /**
   * @param {HTMLElement} [container=document.body] - optional <div> for layout
   * @param {(string\|number)} [startingHour=8] - first hour to display,
   *   strings use 12 hour am, pm format, numbers use 24 hour format
   * @param {(string\|number)} [endingHour=26] - last hour to display,
   *   same format as startingHour,
   *   strings that appear "earlier" than startingHour are assumed to mean
   *     an early morning end time ("2 AM" would imply 2 in the morning),
   *   numbers greater than 24 imply early morning as well.
   */
  constructor({container = document.body, startingHour = 8, endingHour = 26} = {}) {
    this.container = container;
    if (typeof startingHour === "string") {
      this.startingHour = stringToHour(startingHour);
    } else if (typeof startingHour === "number") {
      this.startingHour = startingHour;
    } else {
      throw new Error("invalid starting hour");
    }
    if (typeof endingHour === "string") {
      endingHour = stringToHour(endingHour);
    } else if (typeof endingHour !== "number") {
      throw new Error("invalid starting hour");
    }
    this.endingHour = endingHour <= this.startingHour ? endingHour + 24 : endingHour; 
    this.table = document.createElement("table");
    this.table.classList.add("calendar__table");
    this.body = document.createElement("tbody");
    this.body.classList.add("calendar__body");
    this.table.appendChild(this.body);
    this.container.appendChild(this.table);
    this.pointer = document.createElement("div");
    this.pointer.classList.add("calendar__pointer");
    this.pointer.style.display = "none";
    this.container.appendChild(this.pointer);
    this.events = null;
    this.map = null;
    this.colors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
    window.setInterval(() => this.updatePointer, 60000);
    window.addEventListener("resize", () => this.print());
    window.addEventListener("resize", () => this.updatePointer());
    document.addEventListener("visibilitychange", () => this.updatePointer());
    
    function stringToHour(string) {
      if (typeof string !== "string") {
        throw new Error(`${string} is not a string`);
      }
      const match = /^\s*(\d{1,2})\s*([ap][m])\s*$/.exec(string.toLowerCase());
      if (! match) {
        throw new Error(`${string} is not a valid hour`);
      }
      if (match[1] == "12" && match[2].startsWith("a")) {
        return 0;
      }
      return +match[1] + ((match[2].startsWith("a") || match[1] == "12") ? 0 : 12); 
    }
  }

  empty() {
    while (this.body.firstChild) {
      this.body.removeChild(this.body.firstChild);
    }
  }

  _eventsSortByStarting(a, b) {
    if (a.startHour < b.startHour) {
      return -1;
    }
    if (a.startHour > b.startHour) {
      return 1;
    }
    if (a.startMinutes < b.startMinutes) {
      return -1;
    }
    if (a.startMinutes > b.startMinutes) {
      return 1;
    }
    return 0;
  }

  _height(el) {
    return parseFloat(getComputedStyle(el, null).height.replace("px", ""));
  }

  /**
   * _printTable is a private method for laying out the calendar
   * @param {String[]} columns - names of the columns to display
   */
  _printTable(columns) {
    this.empty();
    // Header & all-day-event rows
    const headerRow = document.createElement("tr");
    //const allDayRow = document.createElement("tr");
    const cell = document.createElement("td");
    cell.classList.add("calendar__td");
    //const dupCell = cell.cloneNode();
    headerRow.appendChild(cell);
    //allDayRow.appendChild(dupCell);
    columns.forEach((col, index) => {
      const cell = document.createElement("th");
      cell.classList.add("calendar__th");
      //const dupCell = cell.cloneNode();
      const text = document.createTextNode(col);
      cell.appendChild(text);
      cell.id = "calendar__col__" + index;
      headerRow.appendChild(cell);
      //allDayRow.appendChild(dupCell);
    });
    this.body.appendChild(headerRow);
    //this.body.appendChild(allDayRow);
    
    // Time column
    const endIndex = (this.endingHour - this.startingHour) * 2;
    for (let i = 0, hour = this.startingHour; i < endIndex; ++i) {
      const hourRow = i % 2 == 0;
      const ampm = (hour < 12 || hour > 23) ? "am" : "pm";
      const timeCell = document.createElement("td");
      timeCell.classList.add("calendar__td");
      const row = document.createElement("tr");
      if (hourRow) {
        let hour_ = hour % 12;
        if (hour_ === 0) {
          hour_ = 12;
        }
        timeCell.appendChild(document.createTextNode(hour_ + ampm));
        timeCell.className = "calendar__hour";
        ++hour;
      } else {
        timeCell.appendChild(document.createTextNode('\u00A0')); // non-breaking space
      }
      row.appendChild(timeCell);
      const backgroundCell = document.createElement("td");
      backgroundCell.classList.add("calendar__td");
      if (hourRow) {
        backgroundCell.className = "calendar__hour";
      }
      backgroundCell.colSpan = columns.length;
      row.appendChild(backgroundCell);
      row.id = "calendar__row__" + i;
      this.body.appendChild(row);
    }
    this.updatePointer();
  }

  /**
   * print displays or refreshes the calendar from an array of events
   * @param {Obj[]?} events - this.events is overwritten when used,
   *   otherwise the calendar is refreshed with this.events
   * @param {function?} map - must input the events and output an array
   *   in the format: [{name:colName, events:[]}, ...]
   * @param {String[]?} colors - ordered list of CSS colors for the columns
   */
  print(events, map, colors) {
    if (events) {
      this.events = events;
    } else if (this.events) {
      events = this.events;
    } else {
      throw new Error("Calendar.print: events undefined");
    }

    if (map) {
      this.map = map;
    } else if (this.map) {
      map = this.map;
    } else {
      throw new Error("Calendar.print: map undefined");
    }

    if (colors) {
      this.colors = colors;
    } else if (this.colors) {
      colors = this.colors;
    } else {
      throw new Error("Calendar.print: colors undefined");
    }

    // build a list of columns
    const columns = map(events);
    const columnNames = columns.map(col => col.name);
    this._printTable(columnNames);
    columns.forEach((col, index) => {
      const color = colors[index % colors.length];
      document.querySelector("#calendar__col__" + index)
        .style.backgroundColor = color;
      const subcolumns = this._makeSubcolumns(col.events);
      subcolumns.forEach((subcolumn, subindex) => {
        for (const event of subcolumn) {  
          const div = document.createElement("div");
          div.textContent = event.title;
          div.style.backgroundColor = color;
          div.classList.add("calendar__event");  
          const pos = this._position(event, index, subcolumns.length, subindex);
          div.style.top = pos.top + "px";
          div.style.left = pos.left + "px";
          div.style.width = pos.width + "px";
          div.style.height = pos.height + "px";
          this.body.appendChild(div);
        }
      });
    });
  }

  _makeSubcolumns(events) {
    events = events.slice();
    events.sort(this._eventsSortByStarting);
    const subcolumns = [];
    while (events.length) {
      let overlapping = [];
      for (let i = 0; i < events.length - 1;) {
        if (overlap(events[i], events[i + 1])) {
          overlapping = overlapping.concat(events.splice(i + 1, 1));
          continue;
        }
        ++i;
      }
      subcolumns.push(events.slice());
      events = overlapping;
    }
    return subcolumns;

    function overlap(a, b) {
      if (b.startHour === a.starHour && b.startMinutes === b.startMinutes) {
        return true;
      }
      if (b.startHour < a.endHour ||
         (b.startHour === a.endHour &&
          b.startMinutes <= b.endMinutes)) {
        return true;
      }
    }
  }
  
  /**
   * _position is a private method for calculating where to place events
   */
  _position(event, colIndex, columnLength, subIndex) {
    const minutesScale = this._height(document.querySelector("#calendar__row__0")) / 30;
    const width = this._width(document.querySelector("#calendar__col__0")) / columnLength;
    let startIndex = (event.startHour * 2) - (this.startingHour * 2);
    if (event.startMinutes >= 30) {
      startIndex++;
      event.startMinutes -= 30;
    }
    const top = this._offset(document.querySelector("#calendar__row__" + startIndex)).top +
      Math.floor(event.startMinutes * minutesScale); 
    let endIndex = (event.endHour * 2) - (this.startingHour * 2);
    if (event.endMinutes >= 30) {
      endIndex++;
      event.endMinutes -= 30;
    }
    const bottom = this._offset(document.querySelector("#calendar__row__" + endIndex)).top +
      Math.floor(event.endMinutes * minutesScale);
    const height = bottom - top;
    const left = this._offset(document.querySelector("#calendar__col__" + colIndex)).left +
      (width * subIndex);
    
    return {top, left, height, width};
  }
  
  _offset(el) {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft
    };
  }

  /**
   * updatePointer moves the current time indicator
   */
  updatePointer() {
    const now = new Date();
    const hours = now.getHours();
    const weeHours = hours < this.startingHour ? 24 : 0;
    const currentRow = document.querySelector(
      "#calendar__row__" + (((hours + weeHours) * 2) - (this.startingHour * 2))
    );
    if (! currentRow) { // out of operating hours range
      this.pointer.style.display = "none";
      return;
    }
    let {top, left} = currentRow.getBoundingClientRect();
    const scale = this._height(currentRow) / 30;
    top += Math.floor(now.getMinutes() * scale);
    this.pointer.style.top = top + "px";
    this.pointer.style.left = left + "px";
    this.pointer.style.display = "block";
  }
  
  _width(el) {
    return parseFloat(getComputedStyle(el, null).width.replace("px", ""));
  }
}
