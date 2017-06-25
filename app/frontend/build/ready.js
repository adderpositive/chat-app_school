$(function() {
 "use strict";

$(".jsPopupOpener").each(function() {
	var $this = $(this),
		$popup = $(".popup." + $this.data("popup"));
	
	$this.magnificPopup({
		type: "inline",
		removalDelay: 200,
		mainClass: 'mfp-fade',
		items: {
			src: $popup
		},
		fixedContentPos: true,
		showCloseBtn: false
	});
});

$(".popup").find(".close").click(function() {
	$.magnificPopup.close();
});


});