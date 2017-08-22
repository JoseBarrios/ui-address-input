const uiAddressInputDocument = document._currentScript || document.currentScript;
const uiAddressInputTemplate = uiAddressInputDocument.ownerDocument.querySelector('#ui-address-input-view');

class UIAddressInput extends HTMLElement{

	static get observedAttributes(){ return ['value']; }

  constructor(model){
    super();
		this.model = new PostalAddress();
		const view = document.importNode(uiAddressInputTemplate.content, true);

		//SHADOW ROOT
		//this.shadowRoot = this.attachShadow({mode: 'open'});
		//this.shadowRoot.appendChild(view);

		this.appendChild(view);

		this.connected = false;
	}


 connectedCallback() {
	 this.connected = true;
	 this.$input = this.querySelector('input');

	 //SHADOW ROOT
	 //this.$input = this.shadowRoot.querySelector('input');

	 this.autocomplete = new google.maps.places.Autocomplete( (this.$input), {types: ['geocode']});
	 // When the user selects an address from the dropdown, populate the address fields in the form.
	 this.autocomplete.addListener('place_changed', e=> {this.setAddress()});
	 //this.$input.addEventListener('focus', e => {this.geolocate(e)});
  }


	// Bias the autocomplete object to the user's geographical location,
	// as supplied by the browser's 'navigator.geolocation' object.
	geolocate() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => {
				var geolocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				var circle = new google.maps.Circle({
					center: geolocation,
					radius: position.coords.accuracy
				});
				this.autocomplete.setBounds(circle.getBounds());
			});
		}
	}

	setAddress(e){
		// Get the place details from the autocomplete object.
		var place = this.autocomplete.getPlace();
		let addressModel = {};
		place.address_components.forEach(item => {
			if(item.types.includes('country')){ addressModel.addressCountry = item.long_name }
			if(item.types.includes('locality')){ addressModel.addressLocality = item.long_name }
			if(item.types.includes("administrative_area_level_1")){ addressModel.addressRegion = item.short_name }
			if(item.types.includes("postal_code")){ addressModel.postalCode = item.short_name }
		})
		//LAT LONG
		let lat = place.geometry.location.lat();
		let lng = place.geometry.location.lng();
		addressModel.disambiguatingDescription = `${lat},${lng}`;
		//Send to value, so it can handle it
		this.value = addressModel;
	}

  attributeChangedCallback(attrName, oldVal, newVal) {
		switch(attrName){
			case 'value':
				//Wait until the fucking Google API is loaded
				let waitForAPIToLoad = () => {
					checkAPI();
				}
				let updateModel = () => {
					this.value = JSON.parse(newVal);
					this._updateEvent();
				}
				let checkAPI = () => {
					//Check if API is loaded
					if(google){ updateModel(); }
					//Try again next chance you get
					else{ requestAnimationFrame(waitForAPIToLoad); }
				}
				checkAPI();
				break;

			default:
				console.warn(`Attribute '${attrName}' is not handled, change that.`)
		}
	}

	_updateEvent(){
		this.dispatchEvent(new CustomEvent('update', {detail: this.value, bubbles:false }));
	}


	get shadowRoot(){return this._shadowRoot;}
	set shadowRoot(value){ this._shadowRoot = value}

	get value(){return PostalAddress.assignedProperties(this.model);}
	set value(value){
		this.model = new PostalAddress(value);
		//This allows for the address to be set programmatically by calling addressInput = model;
		if(this.getAttribute('value') !== JSON.stringify(value)){
			this.setAttribute('value', JSON.stringify(value))
			if(!this.$input.value){
				let city = value.addressLocality;
				let region = value.addressRegion;
				this.$input.value = `${city}, ${region}`
			}
		}
	}

  disconnectedCallback() {
    console.log('disconnected');
  }
}

window.customElements.define('ui-address-input', UIAddressInput);
