$(document).ready(function () {
    /**
     * Div where the game is contained
     * which is hidden al start.
     */
    $game = $('#draggableImg');
    $game.hide();

    /**
     * Constant use to validate 
     */
    const RegEx = /^[a-zA-Z\s]*$/;

    /**
     * Login and difficulty selection modal dialog.
     */
    var $modal = $('#difficulty');

    /**
     * General variable declaration 
     */
    var islandObj = [];
    var difficulty;
    var name;
    // Bool to validate the name input
    var valid = false;
    var score = 0;

    var $gallery = $("#gallery");
    var $islaClass = $('.islas');
    var nameInput = $('form').find('input[type=text]');

    /**
     * Object type Island, it will contain the name and id from the Island and the path where the images are located
     */
    Island = function (name, id, imgMin, imgFull) {
        this.name = name;
        this.id = id;
        this.imgMin = imgMin;
        this.imgFull = imgFull;
    }

    /**
     * Make the name input resizable
     */
    $(function () {
        $('#fullName').resizable();
    });

    /**
     * Two types of random to obtain an island and an image.
     * The first will not repeat a number.
     */
    var nextRndImg = randomFromListGenerator([0, 1, 2, 3, 4]);
    function randomIsland() {
        return Math.floor((Math.random() * 7) + 0);
    }

    /**
     * When the input loose focus this will check if validates 
     * and show a message to the user
     */
    nameInput.blur(function () {
        if (!validateAny(nameInput, RegEx)) {
            notification('warning', 'Solo letras y espacios');
            nameInput.removeClass('valid').addClass('invalid');
        }
        else if (nameInput.val().length == 0)
            nameInput.removeClass('valid').addClass('invalid');
        else {
            nameInput.removeClass('invalid').addClass('valid');
            valid = true;
        }
    });

    /**
     * On submit click it will check if the input if empty if not read the 
     * difficulty value and the name then call function init to start the game.
     */
    $('#submit').click(function () {
        if (valid || nameInput.length > 1) {
            name = nameInput.val()
            difficulty = parseInt($('form').find('input:checked').val());
            $modal.modal('hide');
            init();
        } else {
            nameInput.removeClass('valid').addClass('invalid');
            notification('warning', 'Debe introducir su nombre');
        }
    });

    /**
     * It hide all the game elements by default(div droppable, island and title).
     */
    function hideIsland() {
        $islaClass.children('div').hide();
        $islaClass.find('polygon').hide();
        $islaClass.find('[id*=Text]').hide();
    }

    /**
     * Generate all content to create the game
     */
    function init() {
        var showIsland = [];
        $('#init').prop("disabled", true);

        notification('info', 'Hola ' + name.toUpperCase());
        $('#user').text(name.toUpperCase());

        // show the game container
        $game.show();
        hideIsland();

        // Generates the Island objects from an external data file and insert them into islandObj arary
        for (var i in islas) {
            let isla = new Island(islas[i].name, islas[i].id, islas[i].imgMin, islas[i].imgFull);
            islandObj.push(isla);
        };

        var imgContainer = $('.imgIslas');
        // It will contain the island and the images index to compare them so it cannot repeat an image.
        // By default will be initiated with out of range number.
        var noImgRepeat = [-1 + ' ' + -1];

        /**
         * Will select random images and island, then it will create the gallery. The island object from the images
         * selected will be saved into showIsland variable.
         */
        for (let i = 0; i < difficulty; i++) {
            var rndIsland = randomIsland();
            do {
                var rnd = nextRndImg();
            } while (noImgRepeat.includes(rndIsland + ' ' + rnd));

            showIsland.push(islandObj[rndIsland].id);
            imgContainer.append($('<li class="ui-widget-content ui-corner-tr">'));
            imgContainer.children('li').eq(i).append($(`<img src="${islandObj[rndIsland].imgMin[rnd]}" id="${islandObj[rndIsland].id}_img" class="ui-widget-content items" />`));
            imgContainer.children('li').eq(i).append($(`<a href="${islandObj[rndIsland].imgFull[rnd]}" title="Hacer zoom" class="ui-icon ui-icon-zoomin">View larger</a>`));
            noImgRepeat.push(rndIsland + ' ' + rnd);
        }

        /**
         * Will show in game container the island selected before.
         */
        showIsland.forEach(function (e) {
            $islaClass.find(`[id^=${e}]`).show();
        });

        // #region - jqueryUI


        // Let the gallery items be draggable
        $('li', $gallery).draggable({
            cancel: "a.ui-icon", // clicking an icon won't initiate dragging
            revert: "invalid", // when not dropped, the item will revert back to its initial position
            containment: "#draggableImg",
            helper: "clone",
            cursor: "move"
        });

        // Let the trash be droppable, accepting the gallery items
        showIsland.forEach(function (e) {
            var $element = $(`#${e}`);
            $element.droppable({
                accept: "#gallery > li",
                classes: {
                    "ui-droppable-active": "ui-state-highlight"
                },
                drop: function (event, ui) {
                    // Check if the current dragged image belongs to this container, increase or decrease
                    // the score and show a notification.
                    if ($(this).attr('id') != ui.draggable[0].firstElementChild.id.slice(0, -4)) {
                        score -= 10;
                        notification('error', 'Isla incorrecta, -10 puntos: Puntuación ' + score);
                    } else {
                        deleteImage(ui.draggable, $element);
                        score += 50;
                        notification('success', 'Correcto, + 50 puntos: Puntuación ' + score);
                    }
                }
            });
        });

        // Image deletion function
        function deleteImage($item, $element) {
            $item.fadeOut(function () {
                var $list = $("ul", $element).length ?
                    $("ul", $element) :
                    $("<ul class='gallery ui-helper-reset'/>").appendTo($element);

                $item.find("a.ui-icon-trash").remove();
                $item.appendTo($list).fadeIn(function () {
                    $item
                        .animate({ width: "48px" })
                        .find("img")
                        .animate({ height: "36px" });
                    endGame();
                });
            });
        }

        // Image recycle function
        function recycleImage($item) {
            $item.fadeOut(function () {
                $item.find("a.ui-icon-refresh").remove().end().css("width", "96px")
                    .find("img").css("height", "72px")
                    .end().appendTo($gallery).fadeIn();
            });
        }

        // Image preview function, demonstrating the ui.dialog used as a modal window
        function viewLargerImage($link) {
            var src = $link.attr("href"),
                title = $link.siblings("img").attr("alt"),
                $modal = $("img[src$='" + src + "']");

            if ($modal.length) {
                $modal.dialog("open");
            } else {
                var img = $("<img alt='" + title + "' width='384' height='288' style='display: none; padding: 8px;' />")
                    .attr("src", src).appendTo("body");
                setTimeout(function () {
                    img.dialog({
                        title: title,
                        width: 400,
                        modal: true
                    });
                }, 1);
            }
        }

        // Resolve the icons behavior with event delegation
        $("ul.gallery > li").on("click", function (event) {
            var $item = $(this),
                $target = $(event.target);

            if ($target.is("a.ui-icon-trash")) {
                deleteImage($item);
            } else if ($target.is("a.ui-icon-zoomin")) {
                viewLargerImage($target);
            } else if ($target.is("a.ui-icon-refresh")) {
                recycleImage($item);
            }
            return false;
        });
        // #endregion

        /**
         * Check if all gallery image has been dropped and show a dialog.
         */
        function endGame() {
            if ($('#gallery').children().length == 0) {
                $('#endGame').find('p').text('Fin del juego. Puntuación: ' + score + ' ¿Quieres seguir jugando?');
                $("#endGame").dialog({
                    resizable: false,
                    height: "auto",
                    width: 400,
                    modal: true,
                    buttons: {
                        "Continuar": function () {
                            $(this).dialog("close");
                            reset();
                        },
                        Cancelar: function () {
                            $(this).dialog("close");
                        }
                    }
                });
            }
        }

        /**
         * If the user decided to continue, this will reset the containers.
         */
        function reset() {
            score = 0;
            $gallery.children().remove();
            $islaClass.children('div').children().each(function () {
                $(this).children().remove();
            });
            $('label[for="fullName"]').hide();
            nameInput.prop('disabled', true);
            $modal.modal('show');
        }
    }
});

toastr.options.closeButton = true;
    toastr.options.positionClass = "toast-bottom-right";
    function notification(type, message) {
        if (type == 'success')
            toastr.success(message, '<i>Éxito</i>');
        else if (type == 'error')
            toastr.error(message, 'Ups!!');
        else if (type == 'warning')
            toastr.warning(message, 'Algo ha ido mal!');
        else
            toastr.info(message, 'Bienvenido');
    }

    /**
     * It will check if the value of the input match with the validation rule.
     * @param {Obj} input 
     * @param {Regex} rexExp 
     */
    function validateAny(input, rexExp) {
        let result;
        let field = rexExp.test(input.val());
        if (field)
            result = true;
        else
            result = false;
        return result;
    }

    /**
     * It will alter the order of the elements and return the list.
     * So it will not return a number repeated until all the number in the generated list
     * has been already given.
     * @param {String} list 
     */
    var randomFromListGenerator = function (list) {
        var position = 0;

        for (var i = 0, l = list.length; i < l; i++) {
            var random = Math.floor((Math.random() * l));
            var aux = list[i];
            list[i] = list[random];
            list[random] = aux;
        }

        return function () {
            return list[position++ % list.length];
        }
    }