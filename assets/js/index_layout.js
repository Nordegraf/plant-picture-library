var $grid = $('.isogrid')

$grid.isotope({
  itemSelector: '.element-item',
  layoutMode: 'fitRows',
  filter: '*',
  getSortData: {
    name: '.plant-name',
  },
  sortBy: 'name',
});

var activeFilters = new Set();

$(document).on("ready", function () {
  $grid.css("height", "auto");
  resize_elems();

  $('.filter-btn').filter(function () {
    return $(this).attr('data-rank') > 0;
  }).hide();
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

  $grid.isotope({ filter: Array.from(activeFilters).join(',') });
});

$('.reset-btn').on('click', function () {
  activeFilters = new Set();
  $('.filter-btn').removeClass("clicked");
  $grid.isotope({ filter: '*' });

  $('.filter-btn').filter(function () {
    return $(this).attr('data-rank') > 0;
  }).hide();
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

