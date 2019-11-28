var getUrlParameter = function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    var sParameterName;
    var i;

    for (i = 0; i < sURLVariables.length; i++)
    {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam)
        {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

var resetKey;

$(function() {
    resetKey = getUrlParameter('resetKey');
    if(typeof resetKey === "undefined")
    {
        $("#span-message").text("Error: Please make sure you copied the link correctly.");
    }
    else
    {
        $("#input-password").prop("disabled", false);
        $("#reset-submit").prop("disabled", false);

        $("#reset-submit").click(function(e)
        {
            e.preventDefault();

            $.post( "/api/v1/reset_request",
            { 
                resetKey: resetKey,
                password: $("#input-password").val(),
            }, function( data )
            {
              $("#span-message").text("Done, please login at the link below.");
            }).fail(function(res) {
                $("#span-message").text("An error occurred, please try agan later.");
            });
          $("#span-message").text("Submitting");
        });
    }
});