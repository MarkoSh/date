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
	const compilejs = () =>  src( 'js/scripts.js' )
		.pipe( babel() )
		.pipe( uglify() )
		.pipe( rename( {
			suffix: '.min'
		} ) )
		.pipe( dest( 'dist/static/' ) );
	return gulp.watch( 'js/scripts.js', compilejs );
}


function css() {
	const compilecss = () => src( 'scss/styles.scss' )
		.pipe( sass().on( 'error', () => console.error( sass.logError ) ) )
		.pipe( autoprefixer() )
		.pipe( cleanCss( { compatibility: 'ie8' } ) )
		.pipe( rename( {
			suffix: '.min'
		} ) )
		.pipe( dest( 'dist/static/' ) );
	return gulp.watch( 'scss/styles.scss', compilecss );
}

function html() {
	const compilehtml = () => src( '*.html' )
		.pipe( htmlmin( { collapseWhitespace: true } ) )
		.pipe( dest( 'dist/' ) );
	return gulp.watch( '*.html', compilehtml );
}

exports.default = parallel( html, js, css );