var startDate;
var endDate;

$(function() {
    $.get("/api/v1/manager_projects",function(data)
    {

    	startDate = moment().startOf('month');
    	endDate = moment().endOf('month');

        $("#spinner-pageload").hide();

        $('#datepicker-from').datepicker('setDate', startDate.toDate());
        $('#datepicker-to').datepicker('setDate', endDate.toDate());

        $('.datepicker').show();


        //$("#test-message").text("Manager data here...");

    }).fail(function(response)
    {
    	$("#spinner-pageload").hide();
    	if(response.status == 403)
    	{
            $("#test-message").text("You are not authorised to use this page.");
    	}
    })
});