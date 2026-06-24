// OUTPUT.JS http://www.mat-o-wahl.de
// Output of information / Ausgabe der Informationen
// License: GPL 3
// Mathias Steudtner http://www.medienvilla.com

var arCategoryExplanations = new Array(); // Globales Array für Kriterien-Erklärungen
var arExplanations = new Array();         // Globales Array für Frage-Erklärungen

function fnTransformCsvToArray(csvData) {
	var lines = $.csv.toArrays(csvData, {separator: ';'});
	arCategories = [];
	arCategoryExplanations = [];
	arQuestionsLong = [];
	arExplanations = [];
	arAnswers = [];
	
	for (var i = 1; i < lines.length; i++) {
		var row = lines[i];
		if (row.length < 4 || row[0].trim() === "") continue;
		
		arCategories.push(row[0]);
		arCategoryExplanations.push(row[1] ? row[1].trim() : ""); // Index 1: Kriterium-Erklärung
		arQuestionsLong.push(row[2]);                             // Index 2: Eigentliche Frage
		arExplanations.push(row[3] ? row[3].trim() : "");         // Index 3: Frage-Erklärung
		
		var currentAnswers = [];
		// Antworten starten durch die neue Spalte jetzt bei Index 4
		for (var j = 4; j < row.length; j += 2) {
			if (row[j] && row[j].trim() !== "") {
				currentAnswers.push({
					text: row[j],
					weight: parseInt(row[j+1]) || 0
				});
			}
		}
		arAnswers.push(currentAnswers);
	}
	totalQuestions = arAnswers.length;
}

function fnStart() {
	$("#sectionShowQuestions").hide();
	$("#sectionVotingButtons").hide();
	$("#sectionResults").hide();
	
	fnReadCsv("data/fragen_judge_fileformat.csv", function(csvData) {
        fnTransformCsvToArray(csvData);
        $("#descriptionExplanation").empty().append("");
    });
}

function fnHideWelcomeMessage() { 
	selectedFormatName = $("#formatNote").val().trim();
	if (selectedFormatName === "") {
		selectedFormatName = "unbenanntes Format";
	}
	
	$('#sectionDescription').hide().empty();
	fnShowQuestionNumber(-1);	
}

function fnShowQuestionNumber(questionNumber) {
	questionNumber++;
	
	if (questionNumber < totalQuestions) {
		activeQuestion = questionNumber; 
		
		$("#sectionShowQuestions").fadeOut(300).hide();		
        
		// 1. KRITERIUM-HEADER & KRITERIUMS-ERKLÄRUNG BEREITSTELLEN
        $("#showQuestionsHeader").empty().append("<h2>Kriterium: " + arCategories[questionNumber] + "</h2>");
		if (arCategoryExplanations[questionNumber] && arCategoryExplanations[questionNumber] !== "") {
			// Ersetzt eventuelle Zeilenumbrüche aus der CSV (\n) in echte HTML-Breaks (<br>)
			let formattedCatExpl = arCategoryExplanations[questionNumber].replace(/\n/g, "<br>");
			$("#showQuestionsHeader").append("<p class='text-muted small font-weight-normal mb-0 mt-1'>" + formattedCatExpl + "</p>");
		}

		// 2. FRAGE & FRAGE-ERKLÄRUNG BEREITSTELLEN
        $("#showQuestionsQuestion").empty().append(arQuestionsLong[questionNumber]);			
		if (arExplanations[questionNumber] && arExplanations[questionNumber] !== "") {
			let formattedExpl = arExplanations[questionNumber].replace(/\n/g, "<br>");
			$("#showQuestionsExplanation").empty().append(formattedExpl).show();
		} else {
			$("#showQuestionsExplanation").empty().hide();
		}

		$("#sectionShowQuestions").fadeIn(300);
		$("#sectionVotingButtons").fadeOut(300).hide();
        
        // Dynamische Buttons für diese Frage generieren
        $("#dynamicVotingButtons").empty();
        let currentAnswers = arAnswers[questionNumber];
        
        for(let i=0; i < currentAnswers.length; i++) {
            let btnCol = $("<div class='col mt-2'></div>");
            let btn = $("<button type='button' class='btn btn-primary btn-lg btn-block'></button>")
                .text(currentAnswers[i].text)
                .click(function() {
                    arPersonalPositions[questionNumber] = { 
                        text: currentAnswers[i].text, 
                        weight: currentAnswers[i].weight 
                    };
                    fnShowQuestionNumber(questionNumber);
                });
            btnCol.append(btn);
            $("#dynamicVotingButtons").append(btnCol);
        }

		$("#sectionVotingButtons").fadeIn(300);

	} else {
		let resultsObj = fnEvaluation();
		fnEvaluationCategories(resultsObj);
	} 
}

function fnEvaluationCategories(resultsObj) {
	$("#resultsShort").empty();
	$("#resultsDetailed").empty();

	$("#resultsHeading").empty().append("<h1>Auswertung zu: " + selectedFormatName + "</h1>").fadeIn(500);

	var tableContent = "<div class='row' role='table'><div class='col'>";

    for (const cat in resultsObj.max) {
        let maxPoints = resultsObj.max[cat];
        let achievedPoints = resultsObj.scores[cat];
        let percent = fnPercentage(achievedPoints, maxPoints);
        let barClass = fnBarImage(percent);

        tableContent += "<div class='border rounded mow-row-striped p-3 mb-2' role='row'>";
        tableContent += "<div class='row'>";
        
        tableContent += "<div class='col col-12 col-md-4' role='cell'>";
        tableContent += "<strong>Kriterium: " + cat + "</strong>";
        tableContent += "</div>";

        tableContent += "<div class='col col-12 col-md-8' role='cell'>";
        tableContent += "<div class='progress' style='height: 30px;'>";
        tableContent += "<div class='progress-bar " + barClass + "' role='progressbar' style='width:"+percent+"%;' aria-valuenow='"+percent+"' aria-valuemin='0' aria-valuemax='100'>";
        tableContent += percent + "% (" + achievedPoints + " / " + maxPoints + " Punkte)";
        tableContent += "</div></div></div>";

        tableContent += "</div></div>";
    }

	tableContent += "</div></div>";
	$("#resultsShort").append(tableContent);

	var detailedContent = "<h2>Detaillierte Antwortübersicht (nachträgliche Änderung möglich)</h2>";
	detailedContent += "<div class='table-responsive mt-3'>";
	detailedContent += "<table class='table table-bordered table-striped'>";
	detailedContent += "<thead class='thead-dark'><tr><th style='width: 15%;'>Kriterium</th><th style='width: 45%;'>Frage</th><th style='width: 30%;'>Deine Antwort</th><th style='width: 10%;'>Punkte</th></tr></thead>";
	detailedContent += "<tbody id='detailedTableBody'></tbody></table></div>";

	$("#resultsDetailed").append(detailedContent);

	for (let i = 0; i < totalQuestions; i++) {
		let cat = arCategories[i];
		let question = arQuestionsLong[i];
		let currentAnswerText = arPersonalPositions[i].text;
		let answerWeight = arPersonalPositions[i].weight;

		let row = $("<tr></tr>");
		row.append($("<td></td>").text(cat));
		row.append($("<td></td>").text(question));

		let tdAnswer = $("<td></td>");
		let selectEl = $("<select class='form-control form-control-sm'></select>");
		
		for (let j = 0; j < arAnswers[i].length; j++) {
			let opt = $("<option></option>").val(j).text(arAnswers[i][j].text);
			if (arAnswers[i][j].text === currentAnswerText) {
				opt.attr("selected", "selected");
			}
			selectEl.append(opt);
		}

		selectEl.change(function() {
			let selectedIdx = $(this).val();
			arPersonalPositions[i] = {
				text: arAnswers[i][selectedIdx].text,
				weight: arAnswers[i][selectedIdx].weight
			};
			let updatedResults = fnEvaluation();
			fnEvaluationCategories(updatedResults);
		});

		tdAnswer.append(selectEl);
		row.append(tdAnswer);
		row.append($("<td></td>").addClass("font-weight-bold text-center").text(answerWeight));

		$("#detailedTableBody").append(row);
	}

	$("#resultsDetailed").show();
	$("#sectionResults").show();
}