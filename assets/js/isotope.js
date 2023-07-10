var $grid = $('.isogrid')

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
  console.log(filterValue);
  $grid.isotope({ filter: filterValue });
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

