
$(window).on("load", function () {
    resize_grid_items();

    $('.masongrid').isotope({
        itemSelector: ".grid-item",
        percentPosition: true,
        masonry: {
            columnWidth: ".grid-sizer"
        }
        });
});


$(window).on("resize", function () {
    resize_grid_items();
    $('.masongrid').isotope('layout');
});

function resize_grid_items() {
    $grid = $('.masongrid');

    imgHeight = $grid.find('.grid-item-carousel').height();
    proHeight = $grid.find('.grid-item-profile').height();

    if (imgHeight > proHeight || imgHeight/proHeight > 0.80) {
        $('.grid-item-notes').css('width', '100%');
    } else {
        $('.grid-item-notes').css('width', 'calc(60% - 10px)');
    }
}