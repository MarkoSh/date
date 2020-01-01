declare let axios: any;
declare let Swiper: any;

( ( dom, body, ls, ss ) => {

	const signin = <HTMLFormElement> dom.getElementById( 'signin' );
	function signed() {
		signin.classList.add( 'hidden' );
		const footer = dom.getElementById( 'footer' );
		footer.classList.add( 'signed' );
		const buttons = footer.querySelectorAll( 'a.button' );
		const swiper_el = dom.getElementById( 'swiper' );
		swiper_el.classList.remove( 'hidden' );
		const swiper = new Swiper( '#swiper', {
			autoHeight	: true,
			threshold	: 30,
			on			: {
				init: function () {
					function updateFeed() {
						const feed = dom.getElementById( 'feed-slide' );
						feed.classList.add( 'loading' );
						axios.get( '/feed' + key ).then( ( response: any ) => {
							feed.classList.remove( 'loading' );
							setTimeout( updateFeed, 5000 );
						} ).catch( ( error: any ) => {
							console.error( error );
						} );
					};
					updateFeed();
					buttons.forEach( ( button: HTMLAnchorElement, i: any ) => {
						const hash = button.getAttribute( 'href' );
						button.onclick = e => {
							e.preventDefault();
							swiper.slideTo( i );
							buttons.forEach( ( button: HTMLAnchorElement, i: any ) => button.classList.remove( 'selected' ) );
							button.classList.add( 'selected' );
							return true;
						};
					} );
					const profile = <HTMLFormElement> dom.getElementById( 'profile' );
					{
						let t: any = false;
						profile.onchange = e => {
							if ( t ) clearTimeout( t );
							t = setTimeout( () => {
								profile.dispatchEvent( new Event( 'submit' ) );
							}, 1000 );
						};
					}
					profile.onsubmit = e => {
						e.preventDefault();
						const values = {};
						Array.from( profile.elements ).filter( ( element: any ) => element.name && element.value ).forEach( ( element: any ) => {
							values[ element.name ] = element.value;
						} );
						axios.post( '/profile' + key, values ).then( ( response: any ) => {

						} ).catch( ( error: any ) => {
							console.error( error );
						} );
						return true;
					};

					profile.addEventListener( 'submit_coords', ( e: any ) => {
						const coords_input = <HTMLInputElement> document.getElementById( 'coords' );
						axios.post( '/profile' + key, {
							coords: coords_input.value
						} ).then( ( response: any ) => {

						} ).catch( ( error: any ) => {
							console.error( error );
						} );
					} );
					
					function getProfile() {
						const bd = <HTMLInputElement> profile.querySelector( '#bd' );
						const date = new Date();
						date.setFullYear( date.getFullYear() - 18 );
						bd.max = date.toISOString().substring( 0, 10 );
						axios.get( '/profile' + key ).then( ( response: any ) => {
							if ( response.data.status ) {

								Object.keys( response.data.data ).forEach( ( key: any ) => {
									const element = <HTMLInputElement> profile.querySelector( '#' + key );
									if ( element ) element.value = decodeURI( response.data.data[ key ] );
								} );
							} else console.error( 'Ошибка загрузки профиля' );
						} ).catch( ( error: any ) => {
							console.error( error );
						} );
					}
					getProfile();
					const del = <HTMLInputElement> dom.getElementById( 'delete' );
					del.onclick = e => {
						const answer = prompt( 'Вы уверены, что хотите удалить аккаунт? (Да/Нет)' );
						if ( 'Да' === answer ) {
							del.value = '...';
							del.disabled = true;
							axios.get( '/delete' + key ).then( ( response: any ) => {
								del.value = 'Удалено';
								ls.removeItem( 'key' );
								dom.location.reload();
							} ).catch( ( error: any ) => {
								console.error( error );
							} );
						}
					};
				},
				slideChange: function () {
					const swiper = this;
					const index = swiper.realIndex;
					buttons.forEach( ( button: HTMLAnchorElement, i: any ) => button.classList.remove( 'selected' ) );
					buttons[ index ].classList.add( 'selected' )
				}
			}
		} );
	};
	let key 	= ls.getItem( 'key' );
	if ( key ) {
		axios.get( '/check' + key ).then( ( response: any ) => {
			if ( response.data.status ) {
				signed();
			} else {
				ls.removeItem( 'key' );
				dom.location.reload( true );
			}
		} ).catch( ( error: any ) => {
			console.error( error );
		} );
	} else {
		signin.classList.remove( 'hidden' );
		signin.onsubmit = e => {
			e.preventDefault();
			if ( signin.classList.contains( 'process' ) ) return true;
			signin.classList.add( 'process' );
			const name = <HTMLInputElement> signin.querySelector( '#name' );
			const email = <HTMLInputElement> signin.querySelector( '#email' );
			const submit = <HTMLInputElement> signin.querySelector( '[type="submit"]' );
			submit.value = '...';
			axios.post( '/signin', {
				name	: name.value,
				email	: email.value
			} ).then( ( response: any ) => {
				signin.classList.remove( 'process' );
				if ( response.data.status ) {
					submit.value = String( submit.dataset.default_text );
					signin.reset();
					key = response.data.data;
					ls.setItem( 'key', response.data.data );
					signed();
				} else {
					console.error( response.data.data );
					submit.value = response.data.data;
				}			
			} ).catch( ( error: any ) => {
				console.error( error );
				submit.value = 'Ошибка';
				signin.classList.remove( 'process' );
			} );
			return true;
		};
		
	}

} )( document, document.body, localStorage, sessionStorage );

let tos: any = [];

function map_init( ymaps: any ) {
	tos.forEach( ( to ) => clearInterval( to ) );
	tos = [];
	let ymap: any 		= false;
	const coords_input 	= <HTMLInputElement> document.getElementById( 'coords' );
	const radius	 	= <HTMLInputElement> document.getElementById( 'radius' );
	const form 			= coords_input.form;
	const map 			= <HTMLInputElement> document.getElementById( 'map' );
	const placemark		= new ymaps.Placemark( [ 0, 0 ], {}, {
		preset: 'islands#blueCircleDotIconWithCaption'
	} );
	const circle		= new ymaps.Circle( [ [ 0, 0 ], 1000 ], {}, {
		fillColor	: '#DB709350',
		strokeColor	: '#DB709350',
		strokeWidth	: 1
	} );
	radius.onchange = e => {
		const value = parseInt( radius.value ) * 1000;
		circle.geometry.setRadius( value );
		ymap.setZoom( 13 - parseInt( radius.value ) / 2 );
	};
	if ( navigator.geolocation ) {
		navigator.geolocation.watchPosition( ( position: any ) => {
			tos.forEach( ( to ) => clearInterval( to ) );
			tos = [];
			const center = [
				position.coords.latitude,
				position.coords.longitude
			];
			coords_input.value = JSON.stringify( center );
			form.dispatchEvent( new Event( 'submit_coords' ) );
			if ( ymap ) {
				ymap.setCenter( center );
				ymap.geoObjects.remove( placemark );
				ymap.geoObjects.remove( circle );
			} else {
				ymap = new ymaps.Map( map, {
					controls: [],
					center: center,
					zoom: 13
				} );
			}
			placemark.geometry.setCoordinates( center );
			circle.geometry.setCoordinates( center );
			ymap.geoObjects.add( placemark );
			ymap.geoObjects.add( circle );
		}, ( error: any ) => {
			console.error( error );
			const location = ymaps.geolocation;
			function drawMap() {
				location.get( {
					mapStateAutoApply: true
				} ).then( ( result: any ) => {
					const center = result.geoObjects.get(0).geometry.getCoordinates();
					coords_input.value = JSON.stringify( center );
					form.dispatchEvent( new Event( 'submit_coords' ) );
					if ( ymap ) {
						ymap.setCenter( center );
						ymap.geoObjects.remove( placemark );
						ymap.geoObjects.remove( circle );
					} else {
						ymap = new ymaps.Map( map, {
							controls: [],
							center: center,
							zoom: 13
						} );
					}
					placemark.geometry.setCoordinates( center );
					circle.geometry.setCoordinates( center );
					ymap.geoObjects.add( placemark );
					ymap.geoObjects.add( circle );
					setTimeout( drawMap, 5000 );
				}, ( error: any ) => {
					console.error( error );
					setTimeout( drawMap, 5000 );
				} );
			}
			drawMap();
		} );
	}
}
function map_error( error: any ) {
	console.error( error );
}