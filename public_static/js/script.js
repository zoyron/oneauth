$(function () {
//---------------------------------------------------------Modal--------------------------------------------------------
    const triggerButton = $("#change-dp-trigger")
    triggerButton.on("click", () => {
        const modal = $("#profile-pic-modal")
        const overlay = modal.find(".overlay")

        overlay.on("click", () => {
            modal.addClass("d-none")
        })

        if (modal.hasClass("d-none")) {
            return modal.removeClass("d-none")
        }

        return modal.addClass("d-none")
    })
//---------------------------------------------------------Modal--------------------------------------------------------
//------------------------------------------------Profile Picture Update------------------------------------------------
    var picInput = $("#userpic")
    var avatarPics = $("img.avatar")
    var hiddenInput = $("#avatar-selector")
    var btnClear = $("#btn-clear")
    var userImg = $('.user-pic')
    const origPic = $(userImg[0]).attr('src')

    picInput.change(function () {
        if (picInput.val() === "") {
            if (hiddenInput.val() === "") {
                userImg.map(i=>{$(userImg[i]).attr('src', origPic)});
            } else {
                userImg.map(i=>{$(userImg[i]).attr('src', `https://minio.codingblocks.com/img/avatar-${hiddenInput.val()}.svg`)});
            }
        } else {
            $(avatarPics).removeClass("click-pic")
            hiddenInput.val("")
            readURL(this)
        }
    })
    avatarPics.click(function () {
        picInput.val("")
        $(avatarPics).removeClass("click-pic")
        $(this).addClass("click-pic")
        let idx = avatarPics.index(this)
        ++idx
        hiddenInput.val(idx)
        picInput.change()
    })

    btnClear.click(function () {
        $(avatarPics).removeClass("click-pic")
        picInput.val("")
        hiddenInput.val("")
        picInput.change()
    })
    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $('.user-pic').map(i=>{$(userImg[i]).attr('src', e.target.result)});
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

//------------------------------------------------Profile Picture Update------------------------------------------------

//------------------------------------------------Toggle Nav-Bar Mobile-------------------------------------------------
    var hamburger= $('.hamburger-parent');
    var sidebar= $('.sidebar');
    var closeSidebar= $('.close');

    hamburger.click((e)=>{
        sidebar.toggleClass('sidebar-none');
    })
    closeSidebar.click((e)=>{
        sidebar.toggleClass('sidebar-none');
    })
//------------------------------------------------Toggle Nav-Bar Mobile-------------------------------------------------
})



