var weekpicker;
var weekdate; // Moment Date Object
var sheet_data = 
{
    "monday": {
        "date": null,
        "projects": {},
        "display_total": null
    },
    "tuesday": {
        "date": null,
        "projects": {},
        "display_total": null
    },
    "wednesday": {
        "date": null,
        "projects": {},
        "display_total": null
    },
    "thursday": {
        "date": null,
        "projects": {},
        "display_total": null
    },
    "friday": {
        "date": null,
        "projects": {},
        "display_total": null
    },
    "saturday": {
        "date": null,
        "projects": {},
        "display_total": null
    },
    "sunday": {
        "date": null,
        "projects": {},
        "display_total": null
    },
};

function parseHMS(value) {
    if (typeof value === 'string') {
        var time = value.split(/[^\d]+/);
        var fmt = 'hh:mm'.replace(/\[.*\]/g, '').split(/[^hms]+/);
        var seconds = 0;
        for (var i=0; i<fmt.length; i++) {
          if (fmt[i].match(/[h]/)) {
            seconds += Number(time[i]) * 3600;
          } else if (fmt[i].match(/[m]/)) {
            seconds += Number(time[i]) * 60;
          } else if (fmt[i].match(/[s]/)) {
            seconds += Number(time[i]);
          }
        }
        return seconds;
    }
    return 0;
}

$(function() {
    $.get("/api/v1/user_projects",function(data) {
        $("#spinner-pageload").hide();
        if(data.length == 0)
        {
            $("#test-message").text("You have no projects, use the sofa!");
        }
        else
        {
            /* TODO: Fill out the table */
            weekpicker = $("#header-weekpicker").weekpicker(function(newDate)
            {
                weekdate = newDate.clone();
                $("#header-monday-date").text(newDate.format("Do MMM"));
                $("#header-tuesday-date").text(newDate.add(1, 'd').format("Do MMM"));
                $("#header-wednesday-date").text(newDate.add(1, 'd').format("Do MMM"));
                $("#header-thursday-date").text(newDate.add(1, 'd').format("Do MMM"));
                $("#header-friday-date").text(newDate.add(1, 'd').format("Do MMM"));
                $("#header-saturday-date").text(newDate.add(1, 'd').format("Do MMM"));
                $("#header-sunday-date").text(newDate.add(1, 'd').format("Do MMM"));
            }, function(changedDate)
            {
                weekdate = changedDate.clone();
                $("#header-monday-date").text(changedDate.format("Do MMM"));
                $("#header-tuesday-date").text(changedDate.add(1, 'd').format("Do MMM"));
                $("#header-wednesday-date").text(changedDate.add(1, 'd').format("Do MMM"));
                $("#header-thursday-date").text(changedDate.add(1, 'd').format("Do MMM"));
                $("#header-friday-date").text(changedDate.add(1, 'd').format("Do MMM"));
                $("#header-saturday-date").text(changedDate.add(1, 'd').format("Do MMM"));
                $("#header-sunday-date").text(changedDate.add(1, 'd').format("Do MMM"));

                loadTimes();

                // Set dates of days in sheet_data
                var _date = weekdate.clone();
                $.each(sheet_data, function(index, item) {
                    sheet_data[index].date = _date.clone();
                    _date.add(1, 'd');
                });
            });

            // Set dates of days in sheet_data
            var _date = weekdate.clone();
            $.each(sheet_data, function(index, item) {
                sheet_data[index].date = _date.clone();
                _date.add(1, 'd');
            });


            var table = $('#table-clockentry > table');

            function project_row(project_obj, tier)
            {
                if(project_obj.has_children)
                {
                    var tr;
                    if(tier == 0)
                    {
                        tr = $('<tr>').append($('<td>').html("<b><u>"+project_obj.name+"</u></b>"));
                    }
                    else if(tier == 1)
                    {
                        tr = $('<tr>').append($('<td>').html("<b>"+project_obj.name+"</b>"));
                    }
                    else
                    {
                        tr = $('<tr>').append($('<td>').html(project_obj.name));
                    }

                    // For each day of week
                    $.each(sheet_data, function(day_index, day_object)
                    {
                        tr.append($('<td>'));
                    });

                    tr.appendTo(table);

                    /* Iterate through children */
                    $.each(project_obj.children, function(i, _project_obj)
                    {
                        project_row(_project_obj, tier+1);
                    });
                }
                else
                {
                    var tr;
                    if(tier == 0)
                    {
                        tr = $('<tr>').addClass("row-project-toplevel").append($('<td>').html("<b><u>"+project_obj.name+"</u></b>"));
                    }
                    else if(tier == 1)
                    {
                        tr = $('<tr>').append($('<td>').html("<b>"+project_obj.name+"</b>"));
                    }
                    else
                    {
                        tr = $('<tr>').append($('<td>').html(project_obj.name));
                    }

                    // For each day of week
                    $.each(sheet_data, function(day_index, day_object)
                    {
                        var project_day_input_id = "input-"+project_obj.id+"-"+day_index+"-dummy"; // eg. input-18-monday-dummy
                        // Create cell in table
                        tr.append($('<td>').append($('<input>').addClass("input-time").attr("id",project_day_input_id)));
                    });

                    tr.appendTo(table);

                    // For each day of week
                    $.each(sheet_data, function(day_index, day_object)
                    {
                        var project_day_input_id = "input-"+project_obj.id+"-"+day_index; // eg. input-18-monday

                        $("#"+project_day_input_id+"-dummy").inputSpinner({"inputId": project_day_input_id});

                        // Add to sheet data
                        sheet_data[day_index].projects[project_obj.id] = {};
                        sheet_data[day_index].projects[project_obj.id].input = $("#"+project_day_input_id);
                    });
                }
            }

            /* Add row to table for each project & subproject */
            $.each(data, function(i, project_obj)
            {
                project_row(project_obj, 0);
            });

            var tr = $('<tr>').addClass("row-day-total").append($('<td>').html("<b>Daily Total</b>"));

            $.each(sheet_data, function(day_index, day_object)
            {
                var total_day_display_id = "display-"+day_index+"-total"; // eg. display-monday-total
                // Create cell in table
                tr.append($('<td>').append($('<input>')
                                    .addClass("input-day-total")
                                    .prop("readonly", "readonly")
                                    .attr("id",total_day_display_id)
                ));
            });

            tr.appendTo(table);

            $.each(sheet_data, function(day_index, day_object)
            {
                var total_day_display_id = "display-"+day_index+"-total"; // eg. display-monday-total
                // Add to sheet data
                sheet_data[day_index].display_total = $("#"+total_day_display_id);
            });

            $.each(sheet_data, function(day_index, day_object)
            {
                day_object.display_total.val('00:00');
            });

            /* On timespinner change sum each day and update column totals */
            $(".input-time").on("change", function (event)
            {
                if(event.currentTarget.value > 0)
                {
                    $( event.currentTarget ).addClass("input-time-nonzero");
                }
                else
                {
                    $( event.currentTarget ).removeClass("input-time-nonzero");
                }
                updateDayTotals();

                saveChanges();
            });

            $("#table-clockentry").show();

            loadTimes();
        }
    }).fail(function(res) {
        if(res.status==403)
        {
            /* Need to log in */
            window.location.href = "/login.html";
        }
    });


    /* Log out button */
    $("#button-logout").click(function(e)
    {
      e.preventDefault();

      $.post( "/api/v1/logout",function( data )
      {
        /* Redirect to login page */
        window.location.href = "/login.html";
      }).fail(function(res) {
        alert("Failed to log out.");
      });
    });



    var message_saving = $("#message-saving");
    function saveChanges()
    {
        var dataArray = [];
        $.each(sheet_data, function(day_index, day_object)
        {
            var DateString = day_object.date.format('YYYY-MM-DD');

            $.each(day_object.projects, function(project_index, project_object)
            {
                var newObj = {};
                newObj.date = DateString;
                newObj.project_id = project_index;
                newObj.duration = sheet_data[day_index].projects[project_index].value;
                dataArray.push(newObj);
            });
        });

        $.ajax({
            type: "POST",
            url: "/api/v1/user_times",
            data: JSON.stringify(dataArray),
            contentType: "application/json",
            success: function( data )
            {
                message_saving.text("Changes saved.");
                message_saving.fadeOut(800);
            },
            fail: function(res)
            {
                message_saving.text("Error saving changes!");
            }
        });

        if(message_saving.is(':animated'))
        {
            message_saving.stop().animate({opacity:'100'});
        }
        message_saving.text("Saving changes..");
        message_saving.show();
    }

});

function loadTimes()
{
    $.ajax({
        type: "GET",
        url: "/api/v1/user_times",
        data: { "weekdate": weekdate.format('YYYY-MM-DD') },
        success: function( data )
        {
            /* Clear all cells */
            $.each(sheet_data, function(day_index, day_object)
            {
                $.each(day_object.projects, function(project_index, project_object)
                {
                    project_object.input.val('00:00');
                });
            });

            /* Populate from data */
            $.each(data, function(row_index, row_object)
            {
                sheet_data[row_object.day.trim()].projects[row_object.project_id].input.val(moment.duration(row_object.duration, 'seconds').format('hh:mm', { trim: false }));
            });

            updateTimeColours();

            updateDayTotals();
        },
        fail: function(res)
        {
            console.log("Error loading user_times data: "+res);
        }
    });
}

function updateTimeColours()
{
    $.each(sheet_data, function(day_index, day_object)
    {
        $.each(day_object.projects, function(project_index, project_object)
        {
            var value = parseHMS(project_object.input.val());
            if(value > 0)
            {
                project_object.input.addClass("input-time-nonzero");
            }
            else
            {
                project_object.input.removeClass("input-time-nonzero");
            }
        });
    });
}

function updateDayTotals()
{
    $.each(sheet_data, function(day_index, day_object)
    {
        var total_day = 0;

        $.each(day_object.projects, function(project_index, project_object)
        {
            var parsedValue = parseHMS(project_object.input.val());
            if(!isNaN(parsedValue) && parsedValue > 0)
            {
                total_day += parsedValue;
                sheet_data[day_index].projects[project_index].value = parsedValue;

            }
            else
            {
                sheet_data[day_index].projects[project_index].value = 0;
            }
        })

        if(total_day > 0)
        {
            day_object.display_total.val(moment.duration(total_day, 'seconds').format('hh:mm', { trim: false }));
            day_object.display_total.addClass('input-day-total-nonzero');
        }
        else
        {
            day_object.display_total.val('00:00');
            day_object.display_total.removeClass('input-day-total-nonzero');
        }
    });
}