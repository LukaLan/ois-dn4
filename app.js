
var baseUrl = 'https://rest.ehrscape.com/rest/v1'; // kam kličemo
var queryUrl = baseUrl + '/query';

var username = "ois.seminar"; // usernam in pass za vse
var password = "ois4fri";

var countryBMI = 0;
var patientBMI = 0;
var country;

function getSessionId() { // pridobivanje token-a
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val(); // pridobimo ime iz polja z ID-jem kreirajIme
	var priimek = $("#kreirajPriimek").val();
	var visina = $("#kreirajVisino").val();
	var teza = $("#kreirajTezo").val();
	var ehrId;

	if (!ime || !priimek || !visina || !teza || ime.trim().length == 0 || priimek.trim().length == 0 || visina.trim().length == 0 || teza.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr", // pošiljanje zahteve
		    type: 'POST',
		    success: function (data) {
		        ehrId = data.ehrId; // ko dobimo odgovor
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            partyAdditionalInfo: [{key: "penis", value: visina}, {key: "weight", value: teza}, {key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party", // da vemo, kakšna je forma, moramo pogledati dokumentacijo na ehr scape
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {  // uspešno
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
		                    console.log("Uspešno kreiran EHR '" + ehrId + "'.");
		                    $("#preberiEHRid").val(ehrId);
		                    
		                    
		                    var datumInUra = "2014-11-21T11:40Z";
							var telesnaVisina = visina;
							var telesnaTeza = teza;
							var telesnaTemperatura = "36.50";
							var sistolicniKrvniTlak = "118";
							var diastolicniKrvniTlak = "92";
							var nasicenostKrviSKisikom = "98";
							var merilec = "Luka Lan Gabriel";
						
							if (!ehrId || ehrId.trim().length == 0) {
								$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
							} else {
								$.ajaxSetup({
								    headers: {"Ehr-Session": sessionId}
								});
								var podatki = { // source predloge za vital signs
									// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
								    "ctx/language": "en",
								    "ctx/territory": "SI",
								    "ctx/time": datumInUra,
								    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
								    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
								   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
								    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
								    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
								    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
								    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
								};
								var parametriZahteve = { // klic template-a
								    "ehrId": ehrId,
								    templateId: 'Vital Signs', // template id
								    format: 'FLAT',
								    committer: merilec
								};
								$.ajax({
								    url: baseUrl + "/composition?" + $.param(parametriZahteve),
								    type: 'POST',
								    contentType: 'application/json',
								    data: JSON.stringify(podatki),
								    success: function (res) { // pošiljanje podatkov na server
								    	console.log(res.meta.href);
								    	$("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "' + dodani podatki.</span>");
								    },
								    error: function(err) {
								    	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
										console.log(JSON.parse(err.responseText).userMessage);
								    }
								});
							}
		                    
		                }
		            },
		            error: function(err) {  // neuspešno
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}


function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!</span>");
	} else {
		
		var teza;
		var visina;
		
		
		var AQL = 
			
		"select " +
		"a_a/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value/magnitude as BWM " +
		"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
		"contains OBSERVATION a_a[openEHR-EHR-OBSERVATION.body_weight.v1] " +
		"offset 0 limit 1";
				
		$.ajax({
		    url: baseUrl + "/query?" + $.param({"aql": AQL}),
		    type: 'GET',
		    headers: {"Ehr-Session": sessionId},
		    success: function (res) {
		    	
		    	//console.log(res.resultSet[0]);
		    	teza = res.resultSet[0].BWM;
		    	

		    },
		    error: function() {
		    	alert("Napaka v poizvedbi");
		    }
		});
		 
        $.ajax({
            url: baseUrl + "/view/" + ehrId + "/height",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (data) {
                visina = data[0].height;
                //console.log(data);
            }
        });
		
		
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
	    		//console.log(data);
				var party = data.party;
				//console.log(party);
				//console.log(party.partyAdditionalInfo);
				
				//Metric BMI Formula
				//BMI = ( Weight in Kilograms / ( Height in Meters x Height in Meters ) )
				patientBMI = Math.round(teza / (visina/100 * visina/100));
				//$("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Pacient '" + party.firstNames + " " + party.lastNames + "', s tezo " + teza + " , visino " + visina + " in BMI " + patientBMI + ".</span>");
				if(patientBMI > 0)
					$("#pacientov-bmi").html("<br><br>Pacientov BMI je: <b>" + patientBMI + "</b>.");
				if(patientBMI < 19 || patientBMI > 26)
					$("#prehrana-tekst").html("<br><b>Svetujemo</b>, da si ogledate seznam zdrave prehrane: <a href='#prehrana'>Zdrava prehrana</a>");
				else
					$("#prehrana-tekst").html("<br>V preventivne namene si oglejte še seznam zdrave prehrane: <a href='#prehrana'>Zdrava prehrana</a>");
				if(countryBMI > 0)
					$("#odstotek-predebelih").html("<br><b>Zanimivost!</b> Odstotek odsraslih s preveliko težo v državi " + country + " je " + countryBMI + ".");
				d3.select("svg")
       				.remove();
				narisiGraf(patientBMI);
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}

function narisiGraf(BMI) {
	var margin = {top: 20, right: 20, bottom: 30, left: 30},
      width = $("#diagram-container").width() - margin.left - margin.right,
      height = $("#diagram-container").width()/1.92 - margin.top - margin.bottom;
      //width = $(window).width()*0.6 - margin.left - margin.right,
      //height = $(window).height()*0.3 - margin.top - margin.bottom;
  
  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);
  
  var y = d3.scale.linear()
      .range([height, 0]);
  
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");
  
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(10, "%");
      
  var div = d3.select("#diagram").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);  
  
  var svg = d3.select("#diagram").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  d3.tsv("data.tsv", type, function(error, data) {
    x.domain(data.map(function(d) { return d.letter; }));
    y.domain([0, d3.max(data, function(d) { return d.frequency; })]);
  
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
  
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency");
  
    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", function(d) { var num = d.letter;
          if (15 <= num  && num <= 16) return "sUnder";
          else if (17 <= num  && num <= 18) return "under";
          else if (19 <= num  && num <= 25) return "normal";
          else if (26 <= num  && num <= 30) return "over";
          else if (31 <= num  && num <= 35) return "obese1";
          else if (36 <= num  && num <= 40) return "obese2";
          else if (41 <= num) return "obese3";
        })
        .attr("id", function(d) { var num = d.letter;
        	if (num == BMI) return "selected";
        })
        .attr("x", function(d) { return x(d.letter); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.frequency); })
        .attr("height", function(d) { return height - y(d.frequency); });
  
  });
  
  function type(d) {
    d.frequency = +d.frequency;
    return d;
  }
}


YUI().use(   "datatable", function (Y) {
	
	var widthTable = Math.round(($("#prehrana").width() - 30)/2);

    var zivila = [
        {  aname: 'Polnovredna žita',  chars:[ 'pšenica', 'rž', 'pira', 'ječmen', 'oves', 'proso', 'koruza', 'riž', 'ajda' ] },
        {  aname: 'Sadje in zelenjava', chars:[ 'jabolko', 'banana', 'hruška', 'kaki', 'pomaranča', 'kivi', 'granatno jabolko' ] },
        {  aname: 'Beljakovine', chars:[ 'sir', 'ribe', 'skuta', 'mleko', 'meso', 'jajca', 'oreščki' ] },
        {  aname: 'Maščobe in sladkorji',  chars:[ 'olje', 'maslo', 'bonboni', 'čokolada' ] }
    ];

    //
    //   Create the "parent" DataTable
    //
    var dt_master = new Y.DataTable({
        columns : [
            { key:'aname',  label:'Tip' }
        ],
        data : zivila,
        width: widthTable
    }).render("#mtable");

    //
    // Add a new attribute to track the last TR clicked,
    //   this is used in the details DT formatter below and later
    //   in the row click handler `delegate` for row highlighting
    //
    //  also setup a click listener to update the "selectedRow" attribute on TR
    //  clicks
    //
    dt_master.addAttr("selectedRow", { value: null });

    dt_master.delegate('click', function (e) {
        this.set('selectedRow', e.currentTarget);
     }, '.yui3-datatable-data tr', dt_master);

    //
    //   Create the characters DataTable and render it (it is hidden initially)
    //
    var dt_detail = new Y.DataTable({
        columns : [
            { key:'char_name', label:'Primer hrane' }
         ],
        data : [],
        strings : {
            emptyMessage : "No critter characters were found!"
        },
        width: widthTable
    }).render("#dtable");

    //
    //  Setup a listener to the Master "selectedRowChange" event (i.e. after a
    //  row click)
    //
    dt_master.after('selectedRowChange', function (e) {

        var tr = e.newVal,              // the Node for the TR clicked ...
            last_tr = e.prevVal,        //  "   "   "   the last TR clicked ...
            rec = this.getRecord(tr);   // the current Record for the clicked TR

        //
        //  This if-block does double duty,
        //  (a) it tracks the first click to toggle the "details" DIV to visible
        //  (b) it un-hightlights the last TR clicked
        //
        if ( !last_tr ) {
            // first time thru ... display the Detail DT DIV that was hidden
            Y.one("#chars").show();
        } else {
            last_tr.removeClass("myhilite");
        }

        //
        //  After unhighlighting, now highlight the current TR
        //
        tr.addClass("myhilite");


        //
        //  Collect the "chars" member of the parent record into an array of
        //  objects  with property name "aname"
        //
        var detail_data = [];
        if ( rec.get('chars') ) {
            Y.Array.each( rec.get('chars'), function(item){
                detail_data.push( {char_name:item});
            });
        }

        //
        //  Set the "detail_data" to the dt_detail DataTable
        //    also update the heading in "acategory"
        //   ( it automatically refreshes )
        //
        dt_detail.setAttrs({
            data: detail_data
        });
    });

});


$(document).ready(function() {
	narisiGraf(patientBMI);
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajVisino").val(podatki[2]);
		$("#kreirajTezo").val(podatki[3]);
	});
	$.getJSON("http://www.telize.com/geoip", function(result){
		country = result.country;
		$("#drzava").html(result.country + ", " + result.country_code);
		
		$.ajax({
		  url: "http://apps.who.int/gho/athena/api/GHO/WHOSIS_000010?filter=COUNTRY:" + result.country_code3 + ";REGION:EUR&format=json",
		  dataType: 'jsonp',
		  success: function (res) {
		    //console.log(res.fact[2].value);
		    
		    // vpiši country BMI na html
			countryBMI = res.fact[2].value.numeric;
			//alert("Procent števila predebelih ljudi v " + result.country + " je " + countryBMI);
		  }
		});
    });
});