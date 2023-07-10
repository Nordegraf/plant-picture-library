$(window).on("load", function () {
    $('.masongrid').masonry({
        itemSelector: ".grid-item",
        columnWidth: ".grid-sizer",
        percentPosition: true
        });
});

$('.masongrid').on('layoutComplete', function (event, laidOutItems) {
    var grid = $(this);
    $(this).find('.grid-item-notes').each(function () {
        imgHeight = grid.find('.grid-item-carousel').height();
        proHeight = grid.find('.grid-item-profile').height();

        if (imgHeight > proHeight) {
            $(this).css('width', '100%');
        }

    });
});

$(window).on("resize", function () {
    var grid = $('.masongrid');
    if (grid.length > 0) {
        $('.masongrid').masonry.layout();
    }
});
