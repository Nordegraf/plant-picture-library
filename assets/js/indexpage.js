---
---

// plant loading and search

var contentDiv = document.getElementById("plant-content");
var numPerPage = 24;
var numEntries = 0;
var numLoaded = 0;
var lastLoaded = 0; // index of last loaded plant
var numShown = 0; // number of plants shown on page

// per filter button two important values are needed:
// 1. the filter string containing all filters, including the upper ones
//    e.g. for Karlsruhe, Germany it would be ".Germany.Karlsruhe"
//    these are needed for isotope filtering
// 2. the actual attributes of all of these filters
//    for the example above it would be ".country.city"
//    these are needed to load in more plants fitting the filters
// these values are stored in the object below. the key is the filter string
// the value is a object of the form {attr: filterValue}
var activeFilters = {};
var searchValue = "";

// variables
$.getJSON("{{ "/data.json" | relative_url }}", function(plants) {
  numEntries = plants.length;

  plants.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  // add first page
  fillPage(plants);

  // add pages when load button is clicked
  $('#load-more').on("click", function() {
      fillPage(plants, true);
  });

  // if search button is clicked or enter is pressed
  $('.search-btn').on('click', function () {
    searchValue = $('#search-field').val().toLowerCase();

    activeFilters["searchValue"] = {"name": searchValue};

    fillPage(plants, false);

    $grid.isotope();
  });

  // if filter button is clicked
  $('.filter-btn').on('click', function () {
    var filterValue = $(this).attr('data-filter');
    var rank = parseInt($(this).attr('data-rank'));
    var attr = $(this).attr('data-attr');

    // case: filter is already active
    if ($(this).hasClass("clicked")) {
      $(this).removeClass("clicked");

      removeFilter(filterValue, attr, rank);

      // add next upper filter
      if (rank > 0 && Object.keys(activeFilters).length == 0) {
        var upper = filterValue.split(".")
        upper.pop();
        addFilterValue(upper.join("."), attr);
      }

      $grid.isotope();

      if (Object.keys(activeFilters).length == 0) {
        if (numLoaded < numEntries) {
          $("#load-more").show();
        }
      } else {
        var left = searchFor(activeFilters, plants, numPerPage, false, true);
        if (left.more) {
          $("#load-more").show();
        }
      }

    // case: filter is not active
    } else {
      $(this).addClass("clicked");

      addFilter(filterValue, attr, rank);

      // remove upper filter
      if (rank > 0) {
        var upper = filterValue.split(".")
        upper.pop();
        removeFilterValue(upper.join("."));
      }

      $grid.isotope();

      fillPage(plants, false);
    }

    $(window).trigger('plantupdate');
  });
});

function addFilter(filterValue, attr, rank) {
  addFilterValue(filterValue, attr);

  if (rank > 0) {
    var upper = filterValue.split(".");
    upper.pop();
    clickUpperFilters(upper, rank);
  }

  showLowerFilters(filterValue, rank);
}

function removeFilter(filterValue, attr, rank) {
  removeFilterValue(filterValue);
  hideLowerFilters(filterValue, rank);
}

$(window).on('plantupdate', function() {
  $grid.isotope('reloadItems').isotope();
  resize_elems();

  numLoaded = $('.element-item').length;

  if (numLoaded >= numEntries) {
    $("#load-more").hide();
  }
});

function addFilterValue(value, attribute) {
  var filters = value.split(".");
  filters.shift();

  var filterObject = {};

  var attributes = attribute.split(" ");

  for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    var attr = attributes[i]

    filterObject[attr] = filter.replace("_", " ").replace(":", "'");
  }

  activeFilters[value] = filterObject;
}

function removeFilterValue(value) {
  delete activeFilters[value];
}

function createFilterStr() {
  var filterStr = "";

  for (const [key, value] of Object.entries(activeFilters)) {
    if (key == "searchValue") {
      continue;
    }
    filterStr += key + ", ";
  }

  filterStr = filterStr.slice(0, -2);

  return filterStr;
}


function hideLowerFilters(filterValue, rank) {
  $(filterValue).filter(function () {
    return $(this).attr('data-rank') > rank;
  }).each(function () {
    $(this).removeClass("clicked");
    $(this).hide();

    // remove lower filters from active filters
    // otherwise all of the items will be shown
    removeFilterValue($(this).attr('data-filter'));
  });
}

function showLowerFilters(filterValue, rank) {
  $(filterValue).filter(function () {
    var thisRank = parseInt($(this).attr('data-rank'));
    // only show filters of next lower rank
    return thisRank == rank + 1;
  }
  ).show();
}

function clickUpperFilters(upperGroups, rank) {
  for (var i = 0; i < upperGroups.length+1; i++) {
    var fltrs = upperGroups.join(".");
    var upper = $(fltrs).filter(function () {
      return $(this).attr('data-rank') < rank;
    })
    upper.each(function () {
      $(this).addClass("clicked");
    });

    upperGroups.pop();
    rank--;
  }
}

function unclickUpperFilters(upperGroups, rank) {
  for (var i = 0; i < upperGroups.length+1; i++) {
    var upper = $("." + upperGroups.join(".")).filter(function () {
      return $(this).attr('data-rank') < rank;
    })

    upper.each(function () {
      $(this).removeClass("clicked");
    });

    upperGroups.pop();

    rank--;
  }
}

function fillPage(plants, newPage=false) {
  // add page to contentDiv
  var promises = [];
  var endIndex = 0;
  var toLoad = numPerPage - (numShown % numPerPage)
  if (!newPage && numShown >= numPerPage) {
    toLoad = 0;
  }

  // if no filters are active, simply load new plants in order
  if (Object.keys(activeFilters).length == 0) {
    var endIndex = lastLoaded + toLoad;

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
  } else {
    // if filters are active, load plants fitting the filters
    addPlants(activeFilters, plants, toLoad);
  }

  lastLoaded = endIndex;

  // wait for all promises to be fulfilled
  Promise.allSettled(promises).then(function() {
    $(window).trigger('plantupdate');
  });
}

function searchFor(searchValues, plants, amount, first=false, moreToLoad=false) {
  // searchValue is a JSON object. keys are attributes to search for
  // searches through data for plants with given attributes
  // if first is true, only the first plant is returned
  // if moreToLoad is true, the routine check if there are more plants to load
  var found = [];

  if (moreToLoad) {
    amount++;
  }

  for (var i = 0; i < plants.length; i++) {
    var plant = plants[i];

    for (const [k, v] of Object.entries(searchValues)) {
      for (const [attr, value] of Object.entries(v)) {

        var attrs = plant[attr]

        // string attributes are searched case insensitive
        if (typeof plant[attr] == "string") {
          attrs = attrs.toLowerCase();
        // edge case for attributes that are not defined
        } else if (typeof plant[attr] == "undefined") {
          continue;
        }

        // only add plant if it is not already loaded
        if (attrs.includes(value) && !$(".element-item").is("#"+plant.id)) {
          found.push(plant);
          break;
        }
      }
    }

    if (first && found.length > 0 || !moreToLoad && found.length >= amount) {
      return {"plants": found, "more": false}
    } else if (moreToLoad && found.length >= amount) {
      return {"plants": found.slice(0, amount-1), "more": true}
    }
  }

  return {"plants": found, "more": false}
}

function addPlants(searchValues, plants, amount) {
  // searchValue is a JSON object. keys are attributes to search for

  // search through data for plants with attr if not already loaded
  var promises = [];
  var toAdd = searchFor(searchValues, plants, amount, false, true);

  for (var i = 0; i < toAdd.plants.length; i++) {
    promises.push(addPlant(toAdd.plants[i].id));
  };

  if (toAdd.more) {
    $("#load-more").show();
  } else {
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

  filter: function() {
    var $this = $(this);
    var buttonFilter = createFilterStr();
    var numFilters = Object.keys(activeFilters).length;
    numFilters = Object.keys(activeFilters).includes("searchValue") ? numFilters - 1 : numFilters;

    var filterResult = numFilters > 0 ? $(this).is(buttonFilter) : true;
    var searchResult = searchValue != "" ? $this.text().toLowerCase().includes(searchValue) : true;

    return filterResult && searchResult;
  },
  getSortData: {
    name: '.plant-name',
  },
  sortBy: 'name',
  transitionDuration: 0
});

$(window).ready(function () {
  $('.filter-btn').filter(function () {
    return $(this).attr('data-rank') > 0;
  }).hide();
});

$('.reset-btn').on('click', function () {
  activeFilters = {};
  searchValue = "";
  $('.filter-btn').removeClass("clicked");
  $grid.isotope();

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
