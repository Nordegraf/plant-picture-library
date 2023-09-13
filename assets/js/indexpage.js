---
---

// plant loading and search

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

  $('.filter-btn').on('click', function () {
    var filterValue = $(this).attr('data-filter');
    var rank = $(this).attr('data-rank');

    if ($(this).hasClass("clicked")) {
      activeFilters.delete(filterValue);
      $(this).removeClass("clicked");

      hide_lower_filters(filterValue, rank);

      if (rank > 0 && activeFilters.size == 0) {
        // add next upper filter to active filters if activeFilters is empty otherwise
        var upper = $(this).attr('data-upper').split(' ');
        upper = upper[upper.length - 1];
        activeFilters.add("." + upper);
      }

    } else {
      activeFilters.add(filterValue);
      $(this).addClass("clicked");

      if (rank > 0) {
        var upper = $(this).attr('data-upper').split(' ');
        click_upper_filters(upper, rank);
      }

      show_lower_filters(filterValue, rank);
    }

    // load more plants to fill up page
    if (numEntries % numPerPage != 0) {
      addPage(plants);
    }


    $grid.isotope({ filter: Array.from(activeFilters).join(',') });
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

// Index page layouting and filtering
var $grid = $('.isogrid')

$grid.isotope({
  itemSelector: '.element-item',
  layoutMode: 'fitRows',
  filter: '*',
  getSortData: {
    name: '.plant-name',
  },
  sortBy: 'name',
  transitionDuration: 0
});

var activeFilters = new Set();


$(window).ready(function () {
  $('.filter-btn').filter(function () {
    return $(this).attr('data-rank') > 0;
  }).hide();
});

$('.reset-btn').on('click', function () {
  activeFilters = new Set();
  $('.filter-btn').removeClass("clicked");
  $grid.isotope({ filter: '*' });

  $('.filter-btn').filter(function () {
    return $(this).attr('data-rank') > 0;
  }).hide();

  $('#search-field').val('');

  // show load more button if not all plants are shown
  if ($('.element-item').length < numEntries) {
    $("#load-more").show();
  }
});

$(window).on("resize", function () {
  resize_elems();
});

function hide_lower_filters(filterValue, rank) {
  $(filterValue).filter(function () {
    return $(this).attr('data-rank') > rank;
  }).each(function () {
    $(this).removeClass("clicked");
    $(this).hide();

    // remove lower filters from active filters
    // otherwise all of the items will be shown
    activeFilters.delete($(this).attr('data-filter'));
  });
}

function show_lower_filters(filterValue, rank) {
  $(filterValue).filter(function () {
    // only show filters of next lower rank
    return parseInt($(this).attr('data-rank')) == parseInt(rank) + 1;
  }
  ).show();
}

function click_upper_filters(upperGroups, rank) {
  for (var i = 0; i < upperGroups.length+1; i++) {
    var upper = $("." + upperGroups.join(".")).filter(function () {
      return $(this).attr('data-rank') < rank;
    })
    upper.each(function () {
      $(this).addClass("clicked");
    });

    // remove upper filters from active filters
    // otherwise all of the items will be shown
    activeFilters.delete("." + upperGroups.pop());

    rank--;
  }
}

function unclick_upper_filters(upperGroups, rank) {
  for (var i = 0; i < upperGroups.length+1; i++) {
    var upper = $("." + upperGroups.join(".")).filter(function () {
      return $(this).attr('data-rank') < rank;
    }
    )

    upper.each(function () {
      $(this).removeClass("clicked");
    });

    upperGroups.pop();

    rank--;
  }
}

function resize_elems() {
  var gridwidth = $grid.width();

  var elemMargin = parseInt($grid.find('.element-item').css('margin'));
  var elemMinWidth = parseInt($grid.find('.element-item').css('min-width')) + 2*elemMargin;// min width of each element in px including margin

  num_elems = Math.floor(gridwidth / elemMinWidth);
  num_elems = num_elems > 6 ? 6 : num_elems;

  elemWidth = 100 / num_elems; // width in percentage
  var newWidth = "calc(" + elemWidth + "% - " + elemMargin*2 + "px)";

  $(".element-item").css("width", newWidth);
  $grid.isotope();
}

// plant

