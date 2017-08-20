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

		console.log(this.postalAddress)
	}


 connectedCallback() {
		this.$input = this.shadowRoot.querySelector('input');
		this.$input.addEventListener('blur', e => {this.updated(e)});
		this.$input.addEventListener('focus', e => {this.geolocate(e)});
  }

	loadScript( url, callback ) {
		var script = document.createElement( "script" )
		script.type = "text/javascript";
		if(script.readyState) {  //IE
			script.onreadystatechange = function() {
				if ( script.readyState === "loaded" || script.readyState === "complete" ) {
					script.onreadystatechange = null;
					callback();
				}
			};
		} else {  //Others
			script.onload = function() {
				callback();
			};
		}

		script.src = url;
		document.getElementsByTagName( "head" )[0].appendChild( script );
	}


	fillInAddress(e){
		// Get the place details from the autocomplete object.
		var place = this.autocomplete.getPlace();
		place.address_components.forEach(item => {
			if(item.types.includes('country')){ this.postalAddress.addressCountry = item.short_name }
			else if(item.types.includes('locality')){ this.postalAddress.addressLocality = item.short_name }
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

	updated(e){
		console.log(e.target.value)
		this.value = e.target.value;
	}

  disconnectedCallback() {
    console.log('disconnected');
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
		console.log(attrName, oldVal, newVal);
		if(attrName === 'key' && this.scriptLoaded === false){
			let url = `https://maps.googleapis.com/maps/api/js?key=${newVal}&libraries=places`;
			this.loadScript(url, e => {
				this.scriptLoaded = true;
				// Create the autocomplete object, restricting the search to geographical location types.
				this.autocomplete = new google.maps.places.Autocomplete( (this.$input), {types: ['geocode']});
				// When the user selects an address from the dropdown, populate the address fields in the form.
				this.autocomplete.addListener('place_changed', e=> {this.fillInAddress(e)});
			})
		}
	}

	get shadowRoot(){return this._shadowRoot;}
	set shadowRoot(value){ this._shadowRoot = value}

	get value(){return JSON.parse(this.getAttribute('value'));}
	set value(value){ this.setAttribute('value', JSON.stringify(value))}
}

window.customElements.define('ui-address-input', UIAddressInput);
