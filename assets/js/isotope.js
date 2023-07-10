var $grid = $('.isogrid')

var activeFilters = [];

$(window).on("ready", function () {
  $grid.css("height", "auto");
  $grid.isotope({
    itemSelector: '.element-item',
    layoutMode: 'fitRows',
    filter: '*'
  });
  resize_elems();
});

$('.filter-btn').on('click', function () {
  var filterValue = $(this).attr('data-filter');

  if ($(this).hasClass("clicked")) {
    activeFilters.splice(activeFilters.indexOf(filterValue), 1);
    $(this).removeClass("clicked");
  } else {
    activeFilters.push(filterValue);
    $(this).addClass("clicked");
  }

  $grid.isotope({ filter: activeFilters.join(',') });
});

$('.reset-btn').on('click', function () {
  activeFilters = [];
  $('.filter-btn').removeClass("clicked");
  $grid.isotope({ filter: '*' });
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
  $grid.isotope('layout');
}

