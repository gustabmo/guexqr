// by gustavo.exel@ersge.ch guexel@gmail.com
// https://github.com/ersge-gustavo/ersge-gustavo.github.io

function ecrireDansUnSpan ( span, text ) {
	document.getElementById(span).innerHTML=text;
}

function écrireDansUnSpan ( span, text ) {
	return ecrireDansUnSpan ( span, text );
}

function couleurDunSpan ( span, couleur ) {
	document.getElementById(span).setAttribute('style','color:'+couleur);
}

function mettreUneImage ( img, filename ) {
	document.getElementById(img).setAttribute ( 'src', filename );
}

function estMarque ( checkbox ) {
	return document.getElementById(checkbox).checked;
}

function estMarqué ( checkbox ) {
	return estMarque(checkbox);
}




