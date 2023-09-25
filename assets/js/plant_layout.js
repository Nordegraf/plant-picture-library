$(window).on("load", function () {
    resize_carousel();
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
    $('.masongrid').each(function () {
        imgHeight = $(this).find('.grid-item-carousel').height();
        proHeight = $(this).find('.grid-item-observation').height();

        if (imgHeight > proHeight || imgHeight/proHeight > 0.75) {
            $(this).find('.grid-item-notes').css('width', '100%');
        } else {
            $(this).find('.grid-item-notes').css('width', 'calc(60% - 10px)');
        }
    });
}

function resize_carousel() {
    var carouselWidth = $('.grid-item-carousel').width();
    var carouselHeight = 0;

    $('.plant-img').each(function () {
        var width = this.naturalWidth;
        var height = this.naturalHeight;

        var renderedHeight = height * carouselWidth / width;

        if (renderedHeight > carouselHeight) {
            carouselHeight = renderedHeight;
        }
    });

    $('.carousel-item').css('height', carouselHeight + 'px');
}
