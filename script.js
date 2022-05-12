'use strict';

// // prettier-ignore
// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// let map, mapEvent; // Assigning a global map variable - enable access throughout the scope

// creating class for workouts
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    //this.date = ...
    //this.id =...
    this.coords = coords; // array [lat, lng]
    this.distance = distance; // in KM
    this.duration = duration; // IN MINUTES
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
// child classes - Running & Cycling
class Running extends Workout {
  type = 'running'; // defining a field
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); // calling the calcPace method
    this._setDescription();
  }
  calcPace() {
    // min / km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling'; // defining a field
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type='cycling';
    this.calcSpeed(); // calling the calcSpeed method
    this._setDescription();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//////////////////////////////
// Application Architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
  #map; // private instance property - map
  #mapZoomLevel = 13; // private instance property - mapZoomLevel
  #mapEvent; // private instance property - mapEvent
  #workouts = []; // private empty array - workouts

  constructor() {
    // Get User's position
    this._getPosition(); // invokes the _getPosition method
    // Get data from local storage
    this._getLocalStorage(); // Invokes the _getLocalStorage method
    // Event Listerners and Form

    form.addEventListener('submit', this._newWorkout.bind(this)); // this._newWorkout points to the form - this is WRONG - So we used the bind(this) to point to the App object.
    // change running to cycle type
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)); // bind the this keyword to point to the current object
  }

  _getPosition() {
    // using Geolocation API to get the location  coordinates
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          //  function that has a callback function.
          // this._loadMap is a regular function call, NOT as a method call, since this is a callback function, we are not calling it ourselves. It is to getCurrentPosition function that we'll call this callback function once it gets the current positions of the users, When it calls this method, so this function (this._loadMap) it does so as a regular function call. (  A regular function call defeault is this keyword set to undefined).So we can use the bind() and use this as parameter - this points to the current object and also want inside of _loadMap.
          alert('Could Not find your location');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    //console.log(`https://www.google.co.uk/maps/@${latitude},${longitude}`);
    // !  Display the map on the website
    const coords = [latitude, longitude];
    //console.log(this);
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // ressigned map to the existing map variable @global scope level
    //console.log(map);

    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   attribution:
    //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // }).addTo(map);
    // using the Google map to display in the app

    // using the google maps
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 500,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);

    //  ! MARKER
    // ! Handling clicks on map
    this.#map.on('click', this._showForm.bind(this)); // this.__showForm points to the #map object- this is WRONG - So we used the bind(this) to point to the APP object.

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work); // this method was called as part of the _loadMap method as it need the map to be loaded before the markers render.
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE; // Assigning global variable mapEvent TO mapE to pass through the coordinates
    // Form data to show on the markers
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    // ! Empty the inputs
    // Clear input Fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none'; // remove the animation
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000); // callback function to display form after 1s
  }
  _toggleElevationField() {
    // ! Event Listerner
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Data validation function
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input)); // Creates an array and loops of the array (inputs.every()) using the inputsto check whether the number is finite or not. they Every( ) method will only return true if this value in (Number.isFinite(input) was true for all of the inputs ( all elements in the array) if one of these values was not finite  then the result will be false for one of the elements of the array, then every() will return false and so that will then be the return value for this arrow function.  )
    // check input is positive values
    const allPositive = (...inputs) => inputs.every(input => input > 0); // Creates an array and loops through the input to check the values are greater than 0.
    e.preventDefault(); // prevents the page from reloading as a default
    // ! Get Data from Form object
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout; // Declare workout variable outside of the block scope inorder to accessability
    // ! if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // !Checks if data is valid
      if (
        /* !Number.isFinite(distance) ||*/
        /*!Number.isFinite(duration) || 
        !Number.isFinite(cadence)*/
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence) // inverting the condition - if  the input value are numbers and positve then it will be True - if False then will return from the function the alert!
      )
        return alert('Input have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence); //  defined running the workout object
    }
    // ! if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // !Checks if data is valid
      if (
        /* !Number.isFinite(distance) ||*/
        /*!Number.isFinite(duration) || 
        !Number.isFinite(elevation)*/
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration) // inverting the condition - if  the input value are numbers and positve then it will be True - if False then will return from the function the alert!
      )
        return alert('Input have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation); //  defined cycling the workout object
    }
    // !Add new object to workout array
    this.#workouts.push(workout); // push new workout object in to an array
    console.log(workout);

    // ! Render workout on map as marker
    this._renderWorkoutMarker(workout); //  call the renderWorkoutMarker method with workout object as argument (paramenter)

    // ! Render workout on list
    this._renderWorkout(workout);
    // ! Hide form & clear input fields
    this._hideForm();
    // !Clear input Fields
    // inputDistance.value =
    //   inputDuration.value =
    //   inputCadence.value =
    //   inputElevation.value =
    //     '';
    // Display Marker - using leaflet methods
    //console.log(this.#mapEvent);
    // ! Set Local Storages to all workout
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    // render workout method
    //
    // ! Render workout on map as marker - using leaflet methods
    // Display Marker
    //const { lat, lng } = this.#mapEvent.latlng;
    L.marker(workout.coords) // passing the data from the workout object - to display the marker
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`, // define the colour of the popup
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
           <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
            <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>
    `;
    if (workout.type === 'running')
      html += ` 
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      </div>
    </li>
    `;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;
    form.insertAdjacentHTML('afterend', html); // places the new workout on top - after the last workout method
  }
  // ! Movement on the map
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //console.log(workout);

    // leaflet methods to allow to perform animation and pan and zoom
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      ainmate: true, // set up the animation
      pan: {
        // pan level
        duration: 1,
      },
    });
    // Using the public Interfaces
    // workout.click(); // Due to local storage the click function will no longer work, once we converted out workouts objects  to a string, and then back from string to objects, we lost the prototype chain. So the new Object data recovered  from the local storage are now regular objects and no longer object created by the running or by the cycling class. So therefore, not able to inherit any of their methods.
  }
  // Local Storage methods
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); // stores the object as a string using (JSON.stringify) to the local storage
  }
  _getLocalStorage() {
    //  this method will be excuted right at the beginning of the app
    const data = JSON.parse(localStorage.getItem('workouts')); // Using JSON.PARSE it convertse the stored data in the local storage back to an object
    // console.log(data);

    // check there is some data in the local storage
    if (!data) return;
    this.#workouts = data; // the workout array will alway be empty at first, but if there is any data in the local storage, it will set that workouts array to the data that we had before. Restore the workouts data which are in an array.

    // rendering all the workout
    // loop ovewr the array but do NOT want to create a new array
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App(); // create an NEW object called APP
