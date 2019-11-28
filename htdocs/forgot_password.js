$(function() {
    $("#forgot-submit").click(function(e)
    {
        e.preventDefault();

        $.post( "/api/v1/reset_request",
        { 
            email: $("#input-email").val(),
        }, function( data )
        {
          $("#span-message").text("If your email was subscribed, you'll have been sent a reset link.");
        }).fail(function(res) {
            $("#span-message").text("An error occurred, please try agan later.");
        });
      $("#span-message").text("Submitting");
    });
});