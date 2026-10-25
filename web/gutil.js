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
