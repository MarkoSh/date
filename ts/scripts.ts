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
					maploader();
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

let map, ymaps;

function maploader() {
	const coords_input = <HTMLInputElement> document.getElementById( 'coords' );
	const form = coords_input.form;
	const map_el = document.getElementById( 'map' );
	map_el.classList.add( 'refresh' );
	setTimeout( () => {
		if ( ! map ) map = new ymaps.Map( 'map', {
			center: [ 55.76, 37.64 ],
			controls: [],
			zoom: 14
		} );
		ymaps.geolocation.get( {
			mapStateAutoApply: true
		} ).then( ( result: any ) => {
			const coords = result.geoObjects.get( 0 ).geometry.getCoordinates();
			map.setCenter( coords, 14, { 
				duration: 300
			} );
			map_el.classList.remove( 'refresh' );
			coords_input.value = JSON.stringify( coords );
			form.dispatchEvent( new Event( 'submit_coords' ) );
			setTimeout( maploader, 60000 );
		} );
	}, 1000 );
}

function map_init( ymaps: any ) {
	if ( ! navigator.geolocation ) {
		alert( 'Ваш браузер не поддерижвает геолокацию' );
		const map = document.getElementById( 'map' );
		map.parentElement.classList.add( 'hidden' );
	} else {
		maploader();
	}
}
function map_error( error: any ) {
	console.error( error );
}