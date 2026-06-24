// GENERAL.JS http://www.mat-o-wahl.de
// General functions / Allgemeine Verarbeitungen
// License: GPL 3
// Mathias Steudtner http://www.medienvilla.com

var version = "0.6.0.custom.categories";

var arCategories = [];
var arQuestionsLong = [];
var arAnswers = []; // Speichert die Antwortmöglichkeiten + Gewichtung pro Frage
var arPersonalPositions = []; // Speichert das gewählte Antwort-Objekt {text, weight}

var activeQuestion = 0; 
var totalQuestions = 0;

var selectedFormatName = ""; 

function fnReadCsv(csvFile, fnCallback) {
 $.ajax({ 
	type: "GET", 
	url: csvFile,
	dataType: "text", 
	cache: false, // Verhindert aggressives Caching der CSV
	contentType: "application/x-www-form-urlencoded",
	error: function(objXML, textStatus, errorThrown) {
		console.log("Fehler beim Laden der Datei: " + csvFile);
		$("#descriptionExplanation").html("<span class='text-danger'>Fehler: Die Fragen-Datei konnte nicht geladen werden. Bitte den Administrator informieren.</span>");
	}
 }).done(function(data) {
	fnCallback(data);
 });	
}

function fnTransformCsvToArray(csvData) {
	// Erwartetes Format: Gruppierung;Frage;Antwort_1;Gewichtung_1;Antwort_2;Gewichtung_2;...
	var arZeilen = $.csv.toArrays(csvData, {separator: ";"});
	
	for(let i = 1; i <= arZeilen.length - 1; i++) { // Ab i=1, um Kopfzeile zu überspringen
		if (arZeilen[i].length < 2) continue; // Leere Zeilen ignorieren
        
		arCategories.push(arZeilen[i][0]);
		arQuestionsLong.push(arZeilen[i][1]);
		
		let answersForQuestion = [];
		// Gehe durch die Spaltenpaare für Antworten und Gewichtungen
		for(let j = 2; j < arZeilen[i].length; j+=2) {
			if(arZeilen[i][j] && arZeilen[i][j].trim() !== "") {
				answersForQuestion.push({
					text: arZeilen[i][j],
					weight: parseInt(arZeilen[i][j+1]) || 0
				});
			}
		}
		arAnswers.push(answersForQuestion);
	}
    totalQuestions = arQuestionsLong.length;
}

function fnEvaluation() {
	$("#sectionDescription").empty().hide();
	$("#sectionShowQuestions").empty().hide();
	$("#sectionVotingButtons").empty().hide();	
	$("#sectionNavigation").empty().hide();
	
	var categoryScores = {};
	var categoryMax = {};

	// Berechnung der maximal erreichbaren Punkte und der erreichten Punkte pro Kriterium
	for (let i = 0; i < totalQuestions; i++) {
		let cat = arCategories[i];
		
		if (!categoryMax[cat]) { 
            categoryMax[cat] = 0; 
            categoryScores[cat] = 0; 
        }

		// Finde das höchste Gewicht dieser Frage
		let maxWeight = 0;
		if(arAnswers[i] && arAnswers[i].length > 0) {
		    maxWeight = Math.max(...arAnswers[i].map(a => a.weight));
        }
		categoryMax[cat] += maxWeight;

		// Addiere gewählte Punktzahl, falls nicht übersprungen (99)
		if (arPersonalPositions[i] && arPersonalPositions[i] !== 99) {
			categoryScores[cat] += arPersonalPositions[i].weight;
		}
	}

	return { scores: categoryScores, max: categoryMax };
}

function fnPercentage(value, max) {
    if(max === 0) return 0;
	var percent = value * 100 / max;
	return Math.round(percent); 
}

function fnBarImage(percent) {
	if (percent <= 33) { return "bg-danger"; }
	else if (percent <= 66) { return "bg-warning"; }
	else { return "bg-success"; }
}