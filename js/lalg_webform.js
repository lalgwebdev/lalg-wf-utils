// **********************************************************************
// Various jQuery functions to improve the display of Webforms
//
// *******************  Revert to using $ for jQuery
(function( $ ) {

$(document).ready(function(){
//	console.log("Webform Loaded");

	// Admin or User form
	$isUserForm = $("form.lalg-memb-wf").hasClass("lalg-memb-userdetails");
//console.log($isUserForm);
	

// ****************** FUNCTIONS TO SET FLAGS ETC. DEPENDING ON STATE OF FORM  ***********************
// **************************************************************************************************

// *****************  First Time only on Page Load  *********************************
	// Default Membership Type Required to None on first load (Admin Form - User form has Radios)
	if (!document.referrer.includes('admindetails')) { 
		$("select.lalg-memb-membership-type :nth-child(1)").prop('selected', true);
	}

// ******************  Call Set State function on first load, and change of Membership Type Required  ********
	lalg_set_flags();
	$("select.lalg-memb-membership-type").change(function(){ lalg_set_flags(); });
	$("input.lalg-memb-membership-type").change(function(){ lalg_set_flags(); });	
	$('input.lalg-memb-replace-tag').change(function(){ lalg_set_flags(); });

// *****************  Function called on page load and on changing Membership Type Requested
	function lalg_set_flags() {
		
// ***************************  Get information to work on  ************************
		// Admin or User form
		$isUserForm = $("form.lalg-memb-wf").hasClass("lalg-memb-userdetails");
console.log("User Form = " + $isUserForm);
		
		// Existing Membership Type
		$existingType = $('input.lalg-memb-existing-mship').val();		
		if (!$existingType) { $existingType = "";}				// Convert 'undefined' to String	
console.log("Existing Type = " + $existingType);

		// Existing Membership Status	
		$status = $('input.lalg-memb-mship-status').val();
		if (!$status) { $status = "" }							// Convert 'undefined' to String	
console.log("Existing Status = " + $status);
		
		// Membership Type Required.  Id Number, or zero if none. 
		// Webform Conditionals hide Membership Type Required if it can't be used, else it's mandatory on User form. 
		$typeVis = $("div.lalg-wf-membership-type-wrapper").is(':visible');
			
		// Get the selected new membership type.
		if ($isUserForm) {
			if ($typeVis) {
				$reqType = $("div.lalg-memb-membership-type input:checked").val();
			}
			else $reqType = 0;
		}
		else {
			$reqType = $("select.lalg-memb-membership-type").val();
		}
		if (!$reqType) { $reqType = 0; }
console.log("Requested Type = " + $reqType);		
			
		// Replacement Card Requested
		$replace = false;
		$('input.lalg-memb-replace-tag').each(function() {
			if ($(this).prop('checked')) {$replace = true}				// Set if any Replacement Request set
		});
		
// ***************************  Set Membership Requested  *******************
		// Set Membership Requested flag if any Membership Type set.  Else clear flag.
		if( $reqType ) {
			$("div.lalg-memb-process-tag div:nth-of-type(1) input").prop('checked', true);
		}
		else {
			$("div.lalg-memb-process-tag div:nth-of-type(1) input").prop('checked', false);	
		}
		
// ***************************  Then Set Replacement Card visibility  *******************
		// Hide Replacement Card flags, and uncheck it, if:
		//   Any Membership Type selected, OR 
		//   Existing Type is Empty, OR
		//   Status is Lapsed, or Cancelled
		if ( $reqType || !$existingType || 
		      $status.includes("Lapsed") || $status.includes("Cancelled") ) { 
			$("div.lalg-memb-replace-tag-wrapper").hide();
			$("div.lalg-memb-replace-tag input").prop('checked', false);
		   }
		// Else show flag
		else { $("div.lalg-memb-replace-tag-wrapper").show(); }

		
// ***************************  Set Email Preferences  *******************
		// Set Information Emails flag if joining for the first time, or after lapsing.
		if ( $reqType && ( !$existingType || $status.includes("Lapsed") )) {
			$("input.lalg-memb-emailoptions[data-civicrm-field-key$='contact_1_cg4_custom_9'][value=1]" ).prop('checked', true);
		}
		// Set Newsletter Emails if Joining with plain Membership for first time, after lapsing, or changing membership type.
		if ($reqType == 7 && (!$existingType || $status.includes("Lapsed") || $existingType.includes("Printed"))) {
			$("input.lalg-memb-emailoptions[data-civicrm-field-key$='contact_1_cg4_custom_9'][value=2]" ).prop('checked', true);
		}		

// ***************************  Set Latest Membership Action  ******************
		// Default to New Joiner.  E.g. when Additional HH member added to existing HH.
		$('input.lalg-memb-memact').val(1);
		
		// If any Replace Tag set then Action => Replace.  Can't be set at same time as Membership Requested
		// Override later if required.
		$('input.lalg-memb-replace-tag').each(function() {
			if ($(this).prop('checked')) {$('input.lalg-memb-memact').val(3);}
		});
		
		// Do nothing unless a Membership Type has been selected.
		if ( $reqType ) {
			// If no existing membership then Action => Join
			if (!$existingType) {
				$('input.lalg-memb-memact').val(1);
			}
			else {
				// If Membership State Current or Renewable then Action => Renew
				if ($status.includes("New") || $status.includes("Current") || $status.includes("Renew") || 
						$status.includes("Overdue") || $status.includes("Grace") ) {
					$('input.lalg-memb-memact').val(2);
				}
				// Other Membership status Action => Rejoin
				else {
					$('input.lalg-memb-memact').val(4);
				}
			}	
		}
		console.log("Membership Action = " + $('input.lalg-memb-memact').val());	
	}

//*********************** VARIOUS OTHER FUNCTIONS **************************************
// *************************************************************************************
	
//**************************  Set Billing Email, on Admin Screen  ***********************
//  Set default on page load, or when membership type changes, or copy from Home Email
	if (!$isUserForm) {
		// Set default on page load, if required. (Should always default blank anyway.)
		setDefaultBillingEmail();
		
		// Set default when membership type changes, if required
		$("select.lalg-memb-membership-type").change(function(){
			setDefaultBillingEmail(); 
		});
		
		// Set default when Home Email changes, if required 
		$("input.lalg-memb-email").blur(function(){
			setDefaultBillingEmail();
		});
	}
	
	function setDefaultBillingEmail() {
		// If Membership Type is set and Home Email is blank
// console.log('setDefaultBillingEmail');
		if ($("select.lalg-memb-membership-type").val() && !$("input.lalg-memb-email").val()) {
			$("input.lalg-memb-billing-email").val('membership@lalg.org.uk');			
		}
		else {
			$("input.lalg-memb-billing-email").val('');
		}
	}
	
//**********************  Default Household Name for new Contact  **************************	

	$("input.lalg-memb-lastname").blur(function(){
		if(!$("input.lalg-memb-hhname").val()) {
			$("input.lalg-memb-hhname").val($(this).val() + ' Household');
		}
	});	
	
//**********************  Capitalise Postcode field (on changes)  ****************************
 
	$("input.lalg-memb-postcode").blur(function(){
	  // Capitalise it, and remove blank space
	    $(this).val( $(this).val().toUpperCase() );
		$(this).val($(this).val().trim());
		$(this).val($(this).val().replace("   ", " "));
		$(this).val($(this).val().replace("  ", " "));	  
	  
	  // And copy to the Dedupe Key field (Admin form only)
	  $("input.lalg-memb-ddkey").val($(this).val());
	});	

//**********************  Free Membership (or any zero payment)  *************************
// Hide Payment Method for Zero Total on Payment page
	$("tr#wf-crm-billing-total td:nth-child(2)").each(function() {
		if ($(this).text() == '£ 0.00') {
			$("div.webform-component--civicrm-1-contribution-1-contribution-payment-processor-id input[value=0]").prop("checked", true);
			$("div.webform-component--civicrm-1-contribution-1-contribution-payment-processor-id").hide();
		}
	});
	
//*********************  Hide Messages about Membership Status  **************
// Some values (e.g. 'Grace') are deprecated.
	$("#system-messages-wrapper div.messages").each(function() {
		var txt = $(this).html();
		txt = txt.replace(/"Grace"/g, '"Overdue"');
		txt = txt.replace(/"Expired"/g, '"Lapsed"');
		$(this).html(txt);	
	});
	
//************  Hide/Show the Card-Prompt help field on Payment page  ************
// Hide on first loading - if Admin page
	if (!isUserForm) {
		$("div.lalg-memb-card-prompt").hide();
	}
	
	$('input[name="civicrm_1_contribution_1_contribution_payment_processor_id"]').change(function(){
//		console.log($(this).val());
		var ppid = $(this).val();
		if (ppid >= 9 && ppid <= 12) {
			$("div.lalg-memb-card-prompt").show();
		}
		else {
			$("div.lalg-memb-card-prompt").hide();		
		}
	}); 

	
//****************  Hide/Show the Wait-Prompt field on the Payment Page  ****************
// Hide on first loading
	$("div.lalg-memb-wait-prompt").hide();
	
// Show when Submit button clicked
	$("input.webform-button--submit").click( function() {
		$("div.lalg-memb-wait-prompt").show();
	});


});				// End Document Ready
})(jQuery);		// ******************* Close the $ reversion	

