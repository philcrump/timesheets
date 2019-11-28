(function($) {

    $.fn.weekpicker = function(callback, change_callback) {

        // Variables
        var currentDate = moment().startOf('isoweek'), // Monday of this week
            selectedWeek,
            selectedYear

        var _cb = callback;
        var _change_cb = change_callback;

        // Public functions
        this.getWeek = function () {
            return selectedWeek;
        }

        this.getYear = function () {
            return selectedYear;
        }

        // Private functions
        function getCurrentDate (element) {
            return element.data("DateTimePicker").date();
        }

        function setCurrentDate (element, selectedDate) {
            return element.data("DateTimePicker").date(selectedDate);
        }

        function setWeekYear (element, currentDate) {
            var calendarWeek = currentDate.week();
            var year = currentDate.year();
            var month = currentDate.month();

            selectedWeek = calendarWeek;
            if (month == 11 && calendarWeek == 1) {
                year += 1;
            }
            selectedYear = year;

            element.val("Week " + calendarWeek + ", " + year);
        }

        function createButton (direction, siblingElement) {
            var button = $("<span class='mb-0 p-2' style='cursor: pointer;'></span>");

            if (direction == "next") {
                button.addClass("next-" + siblingElement.attr("id"));
                button.text(">");
                return button.insertAfter(siblingElement);
            } else if (direction == "previous") {
                button.addClass("previous-" + siblingElement.attr("id"));
                button.text("<");
                return button.insertBefore(siblingElement);
            }
        }

        function clickListener(direction, element, inputField) {
          return element.click( function() {
              if (direction == "next") {
                  var newDate = getCurrentDate(inputField).add(7, 'days');
              } else if (direction == "previous") {
                  var newDate = getCurrentDate(inputField).subtract(7, 'days');
              }
              setCurrentDate(inputField, newDate);
              if(_cb != null)
              {
                _cb(newDate);
              }
          });
        }

        return this.each( function() {
            // Append input field to weekpicker
            $(this).append("<input type='text' class='form-control text-center'>");

            var weekpickerDiv = $(this);
            var inputField = weekpickerDiv.find("input");

            // Append DateTimePicker to weekpicker's input field
            inputField.datetimepicker({
                calendarWeeks: true,
                format: 'DD.MM.YYYY',
                defaultDate: currentDate
            }).on("dp.change", function(e) {
                // $(this) relates to inputField here
                var selectedDate = getCurrentDate($(this));
                setWeekYear($(this), selectedDate);
                if(_change_cb != null)
                {
                    _change_cb(selectedDate);
                }
            }).on("dp.show", function() {
                var currentSelectedDate = getCurrentDate($(this));
                setWeekYear($(this), currentSelectedDate);
            }).on("dp.hide", function() {
                var currentSelectedDate = getCurrentDate($(this));
                setWeekYear($(this), currentSelectedDate);
            });
            // Set initial week & year
            setWeekYear(inputField, currentDate);

            // Create next & previous buttons
            var nextButton = createButton("next", weekpickerDiv);
            var previousButton = createButton("previous", weekpickerDiv);
            // Add click listeners to buttons
            clickListener("next", nextButton, inputField);
            clickListener("previous", previousButton, inputField);

            if(_cb != null)
          {
            _cb(currentDate);
          }
        });

    }

}(jQuery));
