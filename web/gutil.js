// 2024-11-26 by gustavo.exel@ersge.ch guexel@gmail.com


function getParamFromURL ( paramName ) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(paramName);
}



function getCookie(cookieName) {
    let cookies = document.cookie;
    let cookieArray = cookies.split("; ");

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        let [name, value] = cookie.split("=");
   
        if (name === cookieName) {
          return decodeURIComponent(value);
        }
    }
 
    return null;
}


function randomStringAZ09 ( length ) {
	let st = '';
	const chars = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
	const charslen = chars.length;
	for ( i=0; i<length; i++ ) {
		st += chars.charAt(Math.floor(Math.random()*charslen));
	}
	return st;
}


function randomString09 ( length ) {
	let st = '';
	const chars = '1234567890';
	const charslen = chars.length;
	for ( i=0; i<length; i++ ) {
		st += chars.charAt(Math.floor(Math.random()*charslen));
	}
	return st;
}


function getIdBrowser() {
	let idb = getCookie('idb');
	if (idb == null) {
		idb = randomStringAZ09 ( 8 );
		console.log ( 'created idBrowser ',idb );
		document.cookie = "idb="+idb+"; path=/";
	}
	return idb;
}


function calculateCRC32(data) {
    const polynomial = 0xEDB88320;
    let crc = 0xFFFFFFFF;

    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? polynomial : 0);
        }
    }
	crc ^= 0xFFFFFFFF;
	crc = BigInt(crc);
	if (crc<0) {
		crc = crc + 0x100000000n;
	}
    return crc;
}


