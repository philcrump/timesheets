$(function() {
    $("#login-submit").click(function(e)
    {
        e.preventDefault();

        $.post( "/api/v1/login",
        { 
            email: $("#input-email").val(),
            password: $("#input-password").val(),
        }, function( data )
        {
          $("#span-message").text("Success!");
          window.location.href = "/";
        }).fail(function(res) {
            if(res.status==403)
            {
                $("#span-message").text("Username and/or password incorrect!");
            }
        });
      $("#span-message").text("Logging in...");
    });
});