const {
	parallel, 
	src, 
	dest 
} 				= require( 'gulp' );

const gulp 		= require( 'gulp' );
const watch 	= require( 'gulp-watch' );

const htmlmin 	= require( 'gulp-htmlmin' );

const babel 	= require( 'gulp-babel' );
const uglify 	= require( 'gulp-uglify' );
const rename 	= require( 'gulp-rename' );

const sass		= require( 'gulp-sass' );
const autoprefixer = require( 'gulp-autoprefixer' );
const cleanCss	= require( 'gulp-clean-css' );

function js() {
	const js = () =>  src( 'js/scripts.js' )
		.pipe( babel() )
		.pipe( uglify() )
		.pipe( rename( {
			suffix: '.min'
		} ) )
		.pipe( dest( 'dist/static/' ) );
	return gulp.watch( 'js/scripts.js', js );
}


function css() {
	const css = () => src( 'scss/styles.scss' )
		.pipe( sass() )
		.pipe( autoprefixer() )
		.pipe( cleanCss( { compatibility: 'ie8' } ) )
		.pipe( rename( {
			suffix: '.min'
		} ) )
		.pipe( dest( 'dist/static/' ) );
	return gulp.watch( 'scss/styles.scss', css );
}

function html() {
	const html = () => src( '*.html' )
		.pipe( htmlmin( { collapseWhitespace: true } ) )
		.pipe( dest( 'dist/' ) );
	return gulp.watch( '*.html', html );
}

exports.default = parallel( html, js, css );