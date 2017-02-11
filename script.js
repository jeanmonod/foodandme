
$(document).ready(function(){

	// Handle the comming back from the barcode reader
	var barcode = getQueryParam('barcode');
	if (barcode) {
		$("#barcode").val(barcode);
		checkProduct(barcode);
	}

	$('#check').click(function() {
		checkProduct($("#barcode").val());
  	});

  	$('#restrictions-form').on("submit",function(e) {
	    e.preventDefault(); 
	    saveRestrictionsToLocalStorage();
	});

	displayRestrictions();

});

$.getJSON("data/allergens.json", function( data ) {
    var items = [];
    $.each( data, function( key, list ) {
        localStorage.setItem(key, JSON.stringify(list));
        items.push('' +
            '<div class="checkbox"><label> ' +
                '<input type="checkbox" value="'+key+'">' + key + '</br><span class="small text-muted">' + list + '</span></input>' +
            '</label></div>'
        );
    });
    $(items.join( "")).appendTo('#restrictions');
});

function getQueryParam(name) {
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if(results == null) {
		return null;
	}
	return results[1] || 0;
}

function displayRestrictions() {
	var unwantedNutriments = getUnwantedNutriments();
	if(!unwantedNutriments.length) {
		unwantedNutriments = "empty";
	}
	$("#actual-restrictions").text(unwantedNutriments);
}

function saveRestrictionsToLocalStorage() {
	var checkboxs = $("#restrictions-form :checkbox");
	var unwantedNutriments = [];
	checkboxs.each(function() {
		if(this.checked == true) {
			console.log(this.value + " " + this.checked);
			unwantedNutriments = unwantedNutriments.concat(JSON.parse(localStorage.getItem(this.value)));
		}
	});
	var custom = $("#restrictions-form #custom-unwanted-nutriment")[0].value;
	if(custom) {
		unwantedNutriments = unwantedNutriments.concat(custom);
	}
	localStorage.setItem("unwanted-utriments-list", JSON.stringify(unwantedNutriments));
	alertSuccess(unwantedNutriments);
	displayRestrictions();
}

function alertSuccess(unwantedNutriments) {
	console.log(unwantedNutriments);
	$('#alter-restriction-saved').removeClass('hide');
		$("#alter-restriction-saved").fadeTo(2000, 500).slideUp(500, function(){
    	$("#alter-restriction-saved").slideUp(500);
	});
}

function getUnwantedNutriments() {
	var unwantedNutriments = localStorage.getItem("unwanted-utriments-list");
	if(unwantedNutriments === null) {
		return [];
	}
	return JSON.parse(unwantedNutriments);
}

function checkProduct(barcode) {
	$.ajax({
		type: "GET",
        url: "https://www.openfood.ch/api/v2/products?barcodes="+barcode,
        headers: {
        'Authorization' : "Token token=ece326557b64da511d99965053239311" // don't fuck with that one!
   		}
    }).then(function(data) {
    	setName(data, barcode);
    	checkComposition(data.data[0].attributes['ingredients-translations'].fr);
    });
}

function checkComposition(composition) {
	$('#check-nok').addClass('hide');
	$('#check-ok').removeClass('hide');
	var unwantedNutriments = getUnwantedNutriments();
	for (var i = 0, len = unwantedNutriments.length; i < len; i++) {
		var unwanted = unwantedNutriments[i];
		var regex = new RegExp('(^|[^a-z])('+unwanted+')($|[^a-z])', 'ig'); // TODO : Smarter regex
		if(regex.test(composition)) {
			composition = composition.replace(regex, ' <span class="bg-danger">$2</span> ');
			$('#check-nok').removeClass('hide');
			$('#check-ok').addClass('hide');
		}	
	}
	$('#product-composition').html(composition);
}


function setName(data, barcode) {
	var name = data.data[0].attributes.name
	if (name == null) {
		name = 'No name for product ' + barcode + ' with id ' + data.data[0].id
	}
	$('#product-name').text(name);
}
