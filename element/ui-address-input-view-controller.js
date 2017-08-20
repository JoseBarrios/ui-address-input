const uiAddressInputDocument = document._currentScript || document.currentScript;
const uiAddressInputTemplate = uiAddressInputDocument.ownerDocument.querySelector('#ui-address-input-view');

class UIAddressInput extends HTMLElement{

	static get observedAttributes(){ return ['value', 'key']; }

  constructor(model){
    super();
		this.model = model || {};
		const view = document.importNode(uiAddressInputTemplate.content, true);
		this.shadowRoot = this.attachShadow({mode: 'open'});
		this.shadowRoot.appendChild(view);
		this.scriptLoaded = false;
		this.postalAddress = new PostalAddress();


		this.connected = false;
		this.updateEvent = new Event('update');
	}


 connectedCallback() {
	 this.connected = true;
	 this.$input = this.shadowRoot.querySelector('input');

	 this.autocomplete = new google.maps.places.Autocomplete( (this.$input), {types: ['geocode']});
	 // When the user selects an address from the dropdown, populate the address fields in the form.
	 this.autocomplete.addListener('place_changed', e=> {this.setAddress(e)});

	 this.$input.addEventListener('blur', e => {this.updated(e)});
	 this.$input.addEventListener('focus', e => {this.geolocate(e)});
  }

	setAddress(e){
		// Get the place details from the autocomplete object.
		var place = this.autocomplete.getPlace();
		place.address_components.forEach(item => {
			if(item.types.includes('country')){ this.postalAddress.addressCountry = item.long_name }
			else if(item.types.includes('locality')){ this.postalAddress.addressLocality = item.long_name }
			else if(item.types.includes("administrative_area_level_1")){ this.postalAddress.addressRegion = item.short_name }
			else if(item.types.includes("postal_code")){ this.postalAddress.postalCode = item.short_name }
		})

		this.postalAddress.streetAddress = place.name;
		this.postalAddress.identifier = place.place_id;
		this.postalAddress.description = place.formatted_address;

		let lat = place.geometry.location.lat();
		let lng = place.geometry.location.lng();
		this.postalAddress.disambiguatingDescription = `${lat},${lng}`;

		this.value = PostalAddress.assignedProperties(this.postalAddress)
		this.dispatchEvent(this.updateEvent);
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

	updated(e){ this.value = e.target.value; }

  attributeChangedCallback(attrName, oldVal, newVal) {
		console.log(attrName, oldVal, newVal)

	}

  disconnectedCallback() {
    console.log('disconnected');
  }


	get shadowRoot(){return this._shadowRoot;}
	set shadowRoot(value){ this._shadowRoot = value}

	get value(){return JSON.parse(this.getAttribute('value'));}
	set value(value){ this.setAttribute('value', JSON.stringify(value))}
}

window.customElements.define('ui-address-input', UIAddressInput);
