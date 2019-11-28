var input_password;
var meter_password;

$(function() {
  input_password = $("#input-password");
  meter_password = $("#meter-password");

  input_password.keyup(function()
  {
    if(input_password.val().length == 0)
    {
      meter_password.css("visibility", "hidden");
    }
    else
    {
      meter_password.css("visibility", "visible");
      var analysis = zxcvbn(input_password.val());
      switch(analysis.score)
      {
        case 0:
          meter_password.css('background-image', 'linear-gradient(to right, #ff0000, #ff0000 10%, #ffffff 10%)');
          break;
        case 1:
          meter_password.css('background-image', 'linear-gradient(to right, #df4500, #df4500 30%, #ffffff 30%)');
          break;
        case 2:
          meter_password.css('background-image', 'linear-gradient(to right, #d0a500, #d0a500 50%, #ffffff 50%)');
          break;
        case 3:
          meter_password.css('background-image', 'linear-gradient(to right, #c3e35c, #c3e35c 75%, #ffffff 75%)');
          break;
        case 4:
          meter_password.css('background-image', 'linear-gradient(to right, #a3ff5c, #a3ff5c 100%, #ffffff 100%)');
          break;
      }
    }
  });

  $("#register-submit").click(function(e)
  {
      e.preventDefault();

      $.post( "/api/v1/register", { 
          name: $("#input-name").val(),
          email: $("#input-email").val(),
          password: $("#input-password").val(),
      }, function( data ) {
        $("#span-message").html("Success! Please <a href=\"/login.html\">click here to log in</a>");
      }).fail(function( xhr ) {
        if(xhr.responseJSON.error)
        {
          $("#span-message").text(`Error: ${xhr.responseJSON.error}`);
        }
        else
        {
          $("#span-message").text('Unknown Error');
        }
      });
    $("#span-message").text("Submitting...");
  });

});