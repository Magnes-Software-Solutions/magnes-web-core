var Scroll_1 = 0
var navBar = document.getElementById('navBarTimida')

function scrolar() {
    var Scroll_2 = window.pageYOffset

    if (Scroll_2 > Scroll_1) {
        navBar.style.top = "-80px"
    } else {
        navBar.style.top = "0"
    }

    if (Scroll_2 <= 0) {
        Scroll_1 = 0
    } else {
        Scroll_1 = Scroll_2
    }
}