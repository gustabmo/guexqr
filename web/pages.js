// 2024-11-26 by gustavo.exel@ersge.ch guexel@gmail.com


function getPage ( numPage ) {

	// return fields are:
	// [0] : title
	// [1] : code for cookie
	// [2] : needs unblocking true/false ?
	// [3] : URL, only used after it's unblocked

	test = 0;

	if (numPage == test++ ) return [
		'Introduction', 'Intro', false,
		'https://docs.google.com/document/d/e/2PACX-1vRQbazzegdrSO96qtf-ZjddeuoEqU4BqAwnRT-MRj_SRtB4aO-i7xMoUWQ9Z8ua7uY3oi8Tqr2DJxk8/pub'
	];

	if (numPage == test++ ) return [
		'Actions à partir de click de buttons', 'BtnOnClick', true,
		'https://docs.google.com/document/d/e/2PACX-1vQKoeCxZt53m_HVj5pgnOHHu4Jq15ZBfVdHcnmIIF0q0W5CmUwfIiCcA-dJb1rd088Ka_vgNu0NLkBN/pub'
	];

	if (numPage == test++ ) return [
		'Actions multiples à partir de click de buttons', 'BtnOnClickMult', true,
		'https://docs.google.com/document/d/e/2PACX-1vRafMFVvQ8hIinhiyxElGWOwLQdCoaSqD_05Mdum7sybNtb_4WRbauLAs8Ylza08NZnG_tBwdyH3RHe/pub'
	];

	if (numPage == test++ ) return [
		'La première fonction en Javascript', 'PrimFunc', true,
		'https://docs.google.com/document/d/e/2PACX-1vSZz6ehL_UIYFhlJSAV5um6LHaNtZHIdj5fAD81VCmwaoBregSIt-c8rCrz0ZeE2yH9jaPJidmMcdOU/pub'
	];

	if (numPage == test++ ) return [
		'Fonctions en Javascript', 'FuncsJS', true,
		'https://docs.google.com/document/d/e/2PACX-1vRL03NXN4jrD84ycza_9ecrmWQk0JNasiwFguyzu2hxqMsi6_LHU05puzlXRg4ue-MSty_yrrl7fr-4/pub'
	];

	if (numPage == test++ ) return [
		'Le jeu Papier / Caillou / Ciseaux', 'JeuPCC', true,
		'https://docs.google.com/document/d/e/2PACX-1vTR_ci7SiESvdVpm94wO6EXEoUYj6ta7_SRqcF5DMgIB7hvMy9HN_k0su99pL2t7GVHO3xvk6Q25ZRH/pub'
	];

	if (numPage == test++ ) return [
		'Choix de l’ordinateur, choix fixe au départ', 'ChoixOrdinateur', true,
		'https://docs.google.com/document/d/e/2PACX-1vQC4IaqAgYW-CD5jbXPR5F-02ckhjqIgwmuHEe0-LpkD3JzJXa_XHbat1PRp6__CeNxIZnAX9Q59QuS/pub'
	];

	if (numPage == test++ ) return [
		'Fonction pour le choix de l’ordinateur', 'FuncChoixOrdi', true,
		'https://docs.google.com/document/d/e/2PACX-1vRIhu9j2qdN6GsI89BO5lJhn3w4jPy40NnDEOU_8h_xEvETKar5pytfX-Y0RZe809M_g44mMlvvCdbR/pub'
	];

	if (numPage == test++ ) return [
		'Modifier la fonction choixAleatoire()', 'MofidFuncChoixAle', true,
		'https://docs.google.com/document/d/e/2PACX-1vRXQHucQvIZdtGIkeUIw3WZw7dHLv8mXJJnd95TO5svQ7WpKjr3qFj2zcIflvJO7MNoZAQE-gtnYZMV/pub'
	];

	if (numPage == test++ ) return [
		'Distinguer entre caillou et ciseaux', 'DistinguerCC', true,
		'https://docs.google.com/document/d/e/2PACX-1vRCxbE1-pG6zepfECXCUZO2_H6AykPZf0XCYvLMswH9wsuWkjOeS2lDTt5ILbLQpNk8CswzV1IXrdq8/pub'
	];

	if (numPage == test++ ) return [
		'Afficher le résultat: qui a gagné, dabord identifier l\'égalité', 'VerifierEgalite', true,
		'https://docs.google.com/document/d/e/2PACX-1vTR5nOU7WlhU3xbQ89SWqCCRs6-8fzM_bQ1ZYP37z8GqGmXJz4khstuispVRZwTrfOzMtOEbncfJr6s/pub'
	];

	if (numPage == test++ ) return [
		'Afficher le résultat: qui a gagné, moi ou l\'ordinteur', 'Moi ou Ordinateur', true,
		'https://docs.google.com/document/d/e/2PACX-1vSB3KJMYTeAwnqmy8cpsm0NmVaTHwko8r_U16GgsZ33GoPTJQOC-7-Q2-ml1q-nJl4mjK2lxJG2pyUv/pub'
	];

	if (numPage == test++ ) return [
		'Afficher notre choix comme image au lieu de texte', 'ImgNotreChoix', true,
		'https://docs.google.com/document/d/e/2PACX-1vTMawkoZ-POhin4qPSV2wLQ5V04nFX7-K_ELBt-Ejn0vYYaVlZtm7JG9ydUCs5jw8l_huIgq311zanf/pub'
	];

	if (numPage == test++ ) return [
		'Montrer le choix de l’ordinateur aussi comme image', 'ImgChoixOrdi', true,
		'https://docs.google.com/document/d/e/2PACX-1vR-fzAJdNTON6mO4mjQbzF8k6HL6RXuL1nKQYUaHWbBtlRkZlHHGFxZvMn0qBb0QflBDK1WtfpEqJOQ/pub'
	];

	if (numPage == test++ ) return [
		'Changer l’affichage des images', 'ImgsFaceAFace', true,
		'https://docs.google.com/document/d/e/2PACX-1vTkwXxkoFqrPPBnv_C3JNQU1EeDCEmA_SwyHBxTHDTmKybIy11PKilEFYW-k-d3QK52iss7Q-EWl3Us/pub'
	];

	if (numPage == test++ ) return [
		'Garder un score des résultats', 'ScoreResult', true,
		'https://docs.google.com/document/d/e/2PACX-1vT4ULwj9tkGqOz2m9wLHhyjJ-4mKP1i3UQQEKoUJs1fwW1sYUnUAzgjJcaFbc_Aqac7XaqvZJKhTt25/pub'
	];

	if (numPage == test++ ) return [
		'Un peu de CSS', 'CSSButtons', true,
		'https://docs.google.com/document/d/e/2PACX-1vS3M9IZ03jeLShmz1HwY-VtlyhXEIIHjg1cNKR1m7kYfheX1XC3Gnxpu2uw9w_zswxZsJykVdXVXTab/pub'
	];

	if (numPage == test++ ) return [
		'Fonction choixTriché()', 'ChoixTriche', true,
		'https://docs.google.com/document/d/e/2PACX-1vTC6jTrF_5Veh4nrRYfWUM25mDOC7zqDtt2jjRi6JKRvES4ycbGnUUO3MTFp38wqS_hDkrg8MHVzeQW/pub'
	];

	if (numPage == test++ ) return [
		'Option entre un jeu honnête ou triché', 'CheckBox', true,
		'https://docs.google.com/document/d/e/2PACX-1vSsyh9E6p5tOiJkgqzgUHH5U5CdT95Fc14Vp4xb_Scc-6UAsLnD3AclxkhjbWU5rnKcbi3sYN0Vk0YX/pub'
	];

	if (numPage == test++ ) return [
		'Une carte “Google Maps” dans notre page web', 'EmbedGMaps', true,
		'https://docs.google.com/document/d/e/2PACX-1vQ3Xg5kd082kdZwRDAusClR8A_Xy7Oailp1I2BEwcsmZ5vcETQ9e9X9WztuCVKiPowJuim-ohx4Rmjh/pub'
	];

	if (numPage == test++ ) return [
		'Plusieurs marqueurs sur la page', 'SeveralMarkers', true,
		'https://docs.google.com/document/d/e/2PACX-1vTIVyGuezM-V8KndFrGJU4YpCVEaQ6h7aGF494PZr3Llh8RYL-9kuJyyYGNVa446JeSk2W8fcA1XJet/pub'
	];

	if (numPage == test++ ) return [
		'Liste ou array', 'Array', true,
		'https://docs.google.com/document/d/e/2PACX-1vTEvGRjLuQjJSW_zjIsETm0ekvQbg7JskrE4Ie4-4RnMgIbpzFMG0UW7Kcw5KZTu3336tCd5jDEGbfw/pub'
	];

	if (numPage == test++ ) return [
		'Nord, sud, est, ouest', 'NSEO', true,
		'https://docs.google.com/document/d/e/2PACX-1vThVP5jUPwb1tTtbiAjEC-t2Wnm4vEa_ayWRBku4ZB-WQLRQTLPr4Vqi398IJcQXXqDsDCJ83MP87Sv/pub'
	];

	if (numPage == test++ ) return [
		'Markers en diagonal', 'Diagonal', true,
		'https://docs.google.com/document/d/e/2PACX-1vSi9hyFNgVuTu_kTNNfpGHjDnD5WJbz-BuqiUW9hlmyWOjuk0tPyaxqRH8FrsV8xialBiSJW2bFo2Km/pub'
	];

	if (numPage == test++ ) return [
		'Markers forment un rectangle', 'Rectangle', true,
		'https://docs.google.com/document/d/e/2PACX-1vThMOjUAOL4f6QG5Bh5Xkm7t5vQwQ5S29q-N1Lwenxj-1jqxdQju4Y3Yx04dkj3H5TUeX5dfznzzrBU/pub'
	];

	if (numPage == test++ ) return [
		'Exemple du QR-Code', 'QRCode', true,
		'https://ersge.ch/'
	];



	return null;
}



