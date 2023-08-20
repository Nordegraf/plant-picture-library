---
---

var contentDiv = document.getElementById("plant-content");
var numPerPage = 24;
var numEntries = 0;
var numLoaded = 0;
var lastLoaded = 0; // index of last loaded plant

// variables
$.getJSON("{{ "/data.json" | relative_url }}", function(plants) {
  numEntries = plants.length;

  plants.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  // add first page
  addPage(plants);

  // add pages when load button is clicked
  $('#load-more').on("click", function() {
    var searchValue = $('#search-field').val().toLowerCase();
    if (searchValue != "") {
      addPlants("name", searchValue, plants, numPerPage);
    } else {
      addPage(plants);
    }

  });

  $('.search-btn').on('click', function () {
    var searchValue = $('#search-field').val().toLowerCase();
    var promises = [];
    var numShown = 0;

    $('#load-more').show();
    $grid.isotope({ filter: function () { return $(this).find('.plant-name').text().toLowerCase().includes(searchValue); } });

    numShown = numLoaded - $('.element-item:hidden').length;
    numShown %= numPerPage;

    if (numShown < numPerPage) {
      promises = addPlants("name", searchValue, plants, numPerPage - numShown);
    }

    // wait for all promises to be fulfilled
    Promise.allSettled(promises).then(function() {
      $(window).trigger('plantupdate');
    });

  });
});

$(window).on('plantupdate', function() {
  $grid.isotope('reloadItems').isotope();
  resize_elems();

  numLoaded = $('.element-item').length;

  if (numLoaded >= numEntries) {
    $("#load-more").hide();
  }
});


function addPage(plants) {
  // add page to contentDiv
  var promises = [];
  var endIndex = 0;
  // round to next multiple of numPerPage
  var endIndex = lastLoaded + numPerPage - (numLoaded % numPerPage);

  if (endIndex > plants.length) {
    endIndex = plants.length;
  }

  for (var i = lastLoaded; i < endIndex; i++) {

    if (is_loaded(plants[i].id)) {
      if (endIndex < plants.length){
        endIndex++;
      }
      continue;
    }

    plantID = plants[i].id;
    promises[i - lastLoaded] = addPlant(plantID);
  }

  lastLoaded = endIndex;

  // wait for all promises to be fulfilled
  Promise.allSettled(promises).then(function() {
    $(window).trigger('plantupdate');
  });
}

function addPlants(attr, value, plants, amount) {
    // search through data for plants with attr if not already loaded
    var promises = [];
    var hide = true;

    for (var i = 0; i < plants.length; i++) {
      var plant = plants[i];
      if (plant[attr].toLowerCase().includes(value) && !$(".element-item").is("#"+plant.id)) {
        promises.push(addPlant(plant.id));
      }

      if (promises.length >= amount) {
        // look up if there is at least one more plant to load
        for (var j = i + 1; j < plants.length; j++) {
          var plant = plants[j];

          if (plant[attr].toLowerCase().includes(value)) {
            hide = false;
            break;
          }

        }

        break;
      }
    }

    if (hide) {
      $("#load-more").hide();
    }

    Promise.allSettled(promises).then(function() {
      $(window).trigger('plantupdate');
    });

    return promises;
}

function addPlant(id) {
  return $.get("{{ site.baseurl }}/plants/"+id+".html", function(data) {
    $("#plant-content").append(data);
  }).promise();
}

function is_loaded(id) {
  if ($("#"+id).length == 1) {
    return true;
  } else {
    return false;
  }
}

// search if enter is pressed
$('#search-field').on('keypress', function (e) {
  if ($(this).val() != '') {
    if (e.keyCode == 13) {
      $('.search-btn').click();
    }
  }
});