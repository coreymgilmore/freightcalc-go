"use strict";

//**************************************************************************************************************
//CONSTANTS

//the additional cost to add to each shipment
//the this basically is the "margin" we make on the freight cost to cover packaging and handling costs.
//this is a number that is in the form 1.15 = 15% extra charge
const PERCENT_ADDITIONAL_CHARGE = 1.15;

//minimum charge
//the lowest price we will charge for freight
//this is a number in dollars
const MINIMUM_CHARGE = 10;

//additional handling charge
//the charge from ups or fedex for packages not shipped in cardboard boxes
//ups and fedex set this rate
//this is a number in dollars
const ADDITIONAL_HANDLING_CHARGE = 9;

//default packages
//this is the list of packages that have a predefined set of dimensions
//put any package that is normally shipped in this array
//this is an array of arrays
//each subarray contains a name (the name of the package), a length, width, and height (in inches), a weight (in pounds), and a boolean of if extra handling is required
//on page load this list is populated into the "defaults" drop down menu

/**these are defined in a separate file**/
/**default-packages.js**/
/**when the app runs, it combines the default-pacakges.js file with this file (script.js) into script.min.js*/
/*this is done so that our default packages are not uploaded to github*/

//**************************************************************************************************************
//FUNCTIONALITY

//PUT LIST OF DEFAULT PACKAGES INTO DOM
//only puts into the template row b/c other rows are cloned from this
function buildDefaultPackageMenu() {
	var select = $('.package-row#template .package-default-options');

	//append options from default packages array
	//first option "custom" is automatically populated in html
	for (var i = 0; i < DEFAULT_PACKAGES.length; i++) {
		var packageName = DEFAULT_PACKAGES[i][0];

		select.append('<option value="' + i + '">' + packageName + '</option>');
	}

	return;
}

//TOGGLE FROM ADDRESS
//not from default
//endable inputs
//clear out inputs
$('.btn-group').on('click', '#from-default-no', function() {
	$('#from-fieldset').attr('disabled', false).find('.form-control').val('');
	return;
});
//from default
//disable inputs
//put default values into inputs from data attributes
$('.btn-group').on('click', '#from-default-yes', function() {
	$('#from-fieldset').attr('disabled', true);

	var inputs = $('#from-fieldset .form-control');
	inputs.each(function () {
		$(this).val($(this).data('default'));
		return;
	});

	return;
});

//POPULATE PACKAGE DIMENSIONS WHEN A DEFAULT PACKAGE IS CHOSEN
//get the values from the default packages array and put it in the gui
$('#list-of-packages').on('change', '.package-default-options', function() {
	//get selected option value
	//this value is the index in the DEFAULT_PACKAGES array of this package
	var optionVal = parseInt($(this).val());

	//get elements for which we will fill in dimension values
	//also get elements for id (basially the index of this package) and if any additional charges apply
	var dims = 		$(this).parents('.form-inline');
	var length = 	dims.find('.package-length');
	var width = 	dims.find('.package-width');
	var height = 	dims.find('.package-height');
	var weight = 	dims.find('.package-weight');
	var id = 		dims.find('.package-id');
	var addCharge = dims.find('.package-additional-charge');

	//catch if user chose "custom" value
	//this is a default and results in the user needing to type in the dimensions
	if (optionVal === -1) {
		length.val("");
		width.val("");
		height.val("");
		weight.val("");
		id.val("-1");
		addCharge.val("false");
		return;	
	}

	//put data for this package into gui
	var chosenPackage = DEFAULT_PACKAGES[optionVal];
	length.val(chosenPackage[1]);
	width.val(chosenPackage[2]);
	height.val(chosenPackage[3]);
	weight.val(chosenPackage[4]);
	id.val(chosenPackage);
	addCharge.val(chosenPackage[5]);

	return;
});

//ADD A NEW PACKAGE ROW
//this is a new set of dimensions for a new package
//this is also used of page load to show the first row
//all this does is clone the hidden template div and shows the row
function addNewPackage() {
	//clone the template
	//remove the id (since this equals template)
	//show the row
	$('.package-row#template').clone().appendTo('#list-of-packages').removeAttr('id').removeClass('hide');
	return;
}

//ADD AN ADDITIONAL PACKAGE
//done when clicking the "+" button
//this clones the template row and appends it end of the list of packages 
//have to use #list-of-packages as the container here b/c everything else is created dynamically
$('#list-of-packages').on('click', '.package-add', function () {
	addNewPackage();
	return;
});

//REMOVE A PACKAGE
//done when clicking the "-" button
//this removes just the row that was clicked on
//have to use #list-of-packages as the container here b/c everything else is created dynamically
$('#list-of-packages').on('click', '.package-remove', function() {
	//count the number for packages visible in the gui
	//user cannot remove the last row
	//aka there must be at least one package in this shipment
	var count = $('#list-of-packages .package-row').length;
	if (count === 1) {
		return;
	}

	//get row for this remove button
	//remove this row
	$(this).parents('.package-row').remove();
	return;
});

//CLONE A PACKAGE
//aka duplicate a package
//used if you are shipping numerous packages that are all the same dimensions
//done when clicking the "repeat" button
//this copies an existing row and appends it right after the existing row being cloned
$('#list-of-packages').on('click', '.package-clone', function() {
	//get row for this button
	var row = $(this).parents('.package-row');

	//get select value
	//since this doesn't get cloned for some reason
	var selectVal = row.find('.package-default-options').val();

	//clone the row
	row.clone().insertAfter(row);

	//set the select value in the new row
	row.next().find('.package-default-options option[value=' + selectVal + ']').attr('selected', true);
	return;
});

//**************************************************************************************************************
//GET FREIGHT RATES

//CHECK IF A ZIP CODE IS VALID
//just checks for length but could be expanded to check other things
//in: string
//out: boolean (true means a zip is not valid)
function isBadZip (inputTxt) {
	var input = inputTxt.trim();

	//5 characters for US
	//6 characters for CA
	if (input.length === 5 || input.length === 6) {
		return false;
	}
	else {
		return true;
	}
}

//GET VALUES FOR A BUNCH OF ELEMENTS
//used to get values from dimensions for packages
//gets values for multiple packages
//in: class of element to get values from
//out: array of values in order from first to last package
function getPackageDetail (elemSelector) {
	var elements = $('#list-of-packages').find(elemSelector);

	var array = [];
	elements.each(function (i) {
		array.push($(this).val().trim());
		return;
	});

	return array;
}

//SHOW AN ERROR MESSAGE
//build and appends an alert message to the gui
//in: string describing error
function showError (text) {
	//element to show message
	var elem = $('#error');

	//clear existing message, if any
	elem.html('');

	//build and show message
	var alert = '<div class="alert alert-danger">' + text + '</div>';
	elem.append(alert);
	return;
}

//CHECK IF DIMENSIONS ARE VALID
//this loops through an array of dimensions
//each array is a list of lengths or widths or etc.
//there is no "else" so loop doesn't break out upon finding the first value that is okay
//the input is an array b/c there could be many packages
//in: array of values for length, width, height, or weight
//out: boolean (false if a dimension is bad, true if all dimensions are ok)
function isValidDimensions (inputArray) {
	for (var i = 0; i < inputArray.length; i++) {
		var value = inputArray[i];

		if (value.length < 1) {
			return false;
		}
		else if (parseFloat(value) < 1 || parseFloat(value) > 125) {
			return false
		}

	}

	//all packages are ok
	return true;
}

//GET FREIGHT RATES
//get inputs for addresses
//get packages
//do some validation
//send out ajax call that gets rates from easypost
//build output table
$('body').on('click', '#get-quotes', function() {
	//get addresses
	//from
	var fromCity = 		$('#from-city').val().trim();
	var fromState = 	$('#from-state').val().trim();
	var fromZip = 		$('#from-zip').val().trim();
	var fromCountry = 	$('#from-country').val().trim();

	//to
	var toCity = 		$('#to-city').val().trim();
	var toState = 		$('#to-state').val().trim();
	var toZip = 		$('#to-zip').val().trim();
	var toCountry = 	$('#to-country').val().trim();

	//shipment details
	var lengths = 		getPackageDetail('.package-length');
	var widths = 		getPackageDetail('.package-width');
	var heights = 		getPackageDetail('.package-height');
	var weights = 		getPackageDetail('.package-weight');
	
	//other
	var addCharges = 	$('#list-of-packages').find('.package-additional-charge');
	var addChargesArray = []
	addCharges.each(function (i) {
		addChargesArray.push($(this).val());
		return;
	});

	//number of packages
	//make sure all dimensions have same count
	var numPackages = 	lengths.length;

	//button
	var btn = 			$(this);

	//table for quotes
	var table = 		$('#cost-results');

	//validation
	if (fromCity.length === 0) {
		showError("You must provide a From City.");
		return;
	}
	if (fromState.length !== 2) {
		showError("You must provide a two character code for the From State.");
		return;
	}
	if (isBadZip(fromZip)) {
		showError("You must provide a 5 or 6 character From Zip code.");
		return;
	}
	if (fromCountry.length !== 2) {
		showError("You must provide a two character code for the From Country.");
		return;
	}

	if (toCity.length === 0) {
		showError("You must provide a To City.");
		return;
	}
	if (toState.length !== 2) {
		showError("You must provide a two character code for the To State.");
		return;
	}
	if (isBadZip(toZip)) {
		showError("You must provide a 5 or 6 character To Zip code.");
		return;
	}
	if (toCountry.length !== 2) {
		showError("You must provide a two character code for the To Country.");
		return;
	}

	if (isValidDimensions(lengths) === false) {
		showError("One of the Lengths of your packages is invalid.");
		return;
	}
	if (isValidDimensions(widths) === false) {
		showError("One of the Widths of your packages is invalid.");
		return;
	}
	if (isValidDimensions(heights) === false) {
		showError("One of the Heights of your packages is invalid.");
		return;
	}
	if (isValidDimensions(weights) === false) {
		showError("One of the Weights of your packages is invalid.");
		return;
	}

	//double check that there is at least one parcel
	if (numPackages < 1) {
		showError("No packages!");
		return;
	}

	//everything validated
	//perform ajax call
	$.ajax({
		type: 	"GET",
		url: 	"/quote/",
		data: 	{
			fromCity: 		fromCity,
			fromState: 		fromState,
			fromZip: 		fromZip,
			fromCountry: 	fromCountry,
			toCity: 		toCity,
			toState: 		toState,
			toZip: 			toZip,
			toCountry: 		toCountry,
			lengths: 		lengths.toString(),
			widths: 		widths.toString(),
			heights: 		heights.toString(),
			weights: 		weights.toString(),
			numPackages: 	numPackages
		},
		beforeSend: function() {
			//disable button
			//set working text
			btn.attr('disabled', true).text('Calculating...');

			//clear existing results from table
			table.html('<tr><td colspan="3">Getting freight rates...</td></tr>');
			return;
		},
		error: function (r) {
			//reset button
			btn.attr('disabled', false).text('Calculate Cost');

			//reset table
			table.html('<tr><td colspan="3">:(</td></tr>');

			//show error
			showError('We could not get the freight rates for some reason. Please try again.');
			return;
		},
		success: function (r) {
			//reset button
			btn.attr('disabled', false).text('Calculate Cost');

			//remove any errors
			$('#error').html('');

			//CHECK IF AN ERROR OCCURED
			//the return value with either be "error" or ""
			if (r === "error" || r === "") {
				table.html('<tr><td colspan="3">Could not retrieve freight rates to due an server error.</td></tr>');
				return;
			}

			//CONVERT TO JSON
			//easypost sends back data in json doc
			var j = JSON.parse(r);

			//get rates
			var rates = 	j['rates'];
			var numRates = 	rates.length;

			//CHECK IF NO RATES WERE RETURNED
			//this usually means there was an error with one of the addresses
			if (rates.length === 0) {
				showError("No rates were found.  Please double check your addresses to be sure they are correct.")
				return;
			}

			//CLEAR TABLE
			table.html('');

			//CHECK IF ANY PACKAGES REQUIRED EXTRA HANDLING CHARGES
			//this would not be calculated by easypost b/c easypost does not know if we are packaging in a cardboard box or not
			//the charge is added for every package that requires the additional charge
			var additionalCharge = 0;
			for (var i = 0; i < addChargesArray.length; i++) {
				if (addChargesArray[i] === "true") {
					additionalCharge += ADDITIONAL_HANDLING_CHARGE;
				}
			}
			if (additionalCharge !== 0) {
				table.append('<tr class="warning"><td colspan="3"><center>Warning! An additional charge of $' + additionalCharge + '.00 was added to this shipment for package(s) not enclosed in cardboard.</td></tr>');
			}

			//ORGANIZE RATES FROM CHEAPEST TO MOST EXPENSIVE
			//put rates, carriers, services into their own arrays
			var ratesArray = 	[];
			var carriersArray =	[];
			var servicesArray = [];
			for (var i = 0; i < numRates; i++) {
				var rateData = rates[i];

				ratesArray.push(parseFloat(rateData['rate'].replace(/,/g, ''))); 	//need to use regex to remove commas b/c parseFloat acts strange otherwise
				carriersArray.push(rateData['carrier']);
				servicesArray.push(rateData['service']);
			}

			//iterate through array to sort them
			//find the min value in the rates array, then find that rate's index
			//put the value into a new output array and do the same using the index for that rate's carrier and service
			//remove the value to shorten the input array
			var ratesOutput = 		[];
			var carriersOutput = 	[];
			var servicesOutput = 	[];
			for (var i = 0; i < numRates; i++) {
				var minRate = 	Math.min.apply(Math, ratesArray);
				var index = 	ratesArray.indexOf(minRate);

				ratesOutput.push(ratesArray[index]);
				carriersOutput.push(carriersArray[index]);
				servicesOutput.push(servicesArray[index]);

				ratesArray.splice(index, 1);
				carriersArray.splice(index, 1);
				servicesArray.splice(index, 1);
			}

			//BUILD ROWS OF RATES FOR GUI
			for (var i = 0; i < numRates; i++) {
				var rate = 		ratesOutput[i];
				var carrier = 	carriersOutput[i];
				var service = 	servicesOutput[i];

				//save raw rate before we transform it
				//for validating freight costs against what we are billed
				var rawRate = rate;

				//ignore fedex rates to outside USA
				//we don't have reliable rates for this
				if (toCountry === "CA" && carrier === "FedEx") {
					continue;
				}

				//add additional margin to rates
				//this covers out handling and packaging costs
				rate *= PERCENT_ADDITIONAL_CHARGE;

				//ensure a minimum charge
				if (rate < MINIMUM_CHARGE) {
					rate = MINIMUM_CHARGE;
				}

				//add in any additional handling charge
				rate += additionalCharge;

				//round up to next dollar and display as 2 decimal points
				rate = (parseInt(rate) + 1).toFixed(2);

				//buld row and add to table
				var row = '' + 
					'<tr>' + 
						'<td>' + carrier +  '</td>' +
						'<td>' + service +  '</td>' +
						'<td title="' + rawRate +'">$' + rate + 	'</td>' +
					'</tr>';

				table.append(row);
			}

			return;
		}
	});
	return;
});










//**************************************************************************************************************
//ON PAGE LOAD
$(function() {
	//populate list of default packages
	buildDefaultPackageMenu();

	//show the first row
	addNewPackage();

	return;
});