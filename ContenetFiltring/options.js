/**
 * JS для управления опциями. Это, скорее всего, ужасная bastardization MVC,
 * И / или плохой реализацией бесчисленных превосходных JS-инфраструктур.
 * */

// заполняем выбранный виджет («вид») текущими фильтрами
function populate() {
    var selector = document.getElementById("filterSelector");
    while (selector.options.length > 0) {
        selector.remove(0);
    }

    var allFilters = chrome.extension.getBackgroundPage().allFilters;
    for (var i in allFilters) {
        var option = document.createElement("option");
        option.text = allFilters[i];
        option.value = allFilters[i];
        selector.add(option, null);
    }
}


// сохранять и активировать изменения, сделанные в представлении
function applyChanges() {
    var allFilters = [];
    var selector = document.getElementById("filterSelector");
    for (var i = 0; i < selector.options.length; i++) {
        allFilters[i] = selector.options[i].value;
    }

    var bgPage = chrome.extension.getBackgroundPage();

    // вносим изменения, сохраняем их в localStorage
    bgPage.setFilters(allFilters);
    // удаление и повторное добавление всех прослушивателей
    bgPage.refreshFilters();
}
// добавление нового фильтра в представление
function addNew() {
    var editBox = document.getElementById("newFilter");
    var newFilter = editBox.value;
    if (!newFilter) {
        return;
    }

    var selector = document.getElementById("filterSelector");
    var option = document.createElement("option");
    option.text = "*://*." + editBox.value + "/*";
    option.value = "*://*." + editBox.value + "/*";
    selector.add(option, null);
    editBox.value = null;

    applyChanges();
    sendNotification('Фильтр ' + option.value, {
        body: 'Добавлен.',
        icon: 'enabled.png',
        dir: 'auto'
    });
}


// удалить фильтр, поместить его в текстовое поле для редактирования
function removeOrEdit() {
    var selector = document.getElementById("filterSelector");
    var index = selector.selectedIndex;
    if (index == -1) {
        return;
    }

    var removedOption = selector.options[index];
    selector.remove(index);
    var editBox = document.getElementById("newFilter");
    editBox.value = removedOption.value;

    applyChanges();
    sendNotification('Фильтр ' + editBox.value, {
        body: 'Удалён.',
        icon: 'disabled.png',
        dir: 'auto'
    });
}


// помещаем фильтры из default_filters.js в представление 
function restoreDefaults() {
    //проверка согласия
    //if (!chrome.extension.getBackgroundPage().confirm("Это приведет к удалению пользовательских фильтров. Вы уверены?")) {
   //     return;
   // }

    var bgPage = chrome.extension.getBackgroundPage();
    bgPage.setFilters(bgPage.defaultFilters);
    bgPage.refreshFilters();
    populate();
        sendNotification('Настройки', {
        body: 'Восстановлены заводские настройки.      Все пользовательские фильтры удалены!',
        icon: 'enabled.png',
        dir: 'auto'
    });
}
//сортировка фильторов
function sortFilters() {
    var bgPage = chrome.extension.getBackgroundPage();
    var allFilters = bgPage.allFilters;
    allFilters.sort();
    // persist back to localStorage:
    bgPage.setFilters(allFilters);
    populate();
    sendNotification('Фильтры', {
        body: 'Отсортированы.',
        icon: 'enabled.png',
        dir: 'auto'
    });
}
//Уведомления
function sendNotification(title, options) {
    // Проверим, поддерживает ли браузер HTML5 Notifications
    if (!("Notification" in window)) {
        alert('Ваш браузер не поддерживает HTML Notifications, его необходимо обновить.');
    }

    // Проверим, есть ли права на отправку уведомлений
    else if (Notification.permission === "granted") {
        // Если права есть, отправим уведомление
        var notification = new Notification(title, options);

        function clickFunc() { alert('Пользователь кликнул на уведомление'); }

        notification.onclick = clickFunc;
    }

    // Если прав нет, пытаемся их получить
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function(permission) {
            // Если права успешно получены, отправляем уведомление
            if (permission === "granted") {
                var notification = new Notification(title, options);
                alert("Права успешно пол!");

            } else {
                alert('Вы запретили показывать уведомления'); // Юзер отклонил наш запрос на показ уведомлений
            }
        });
    } else {
        // Пользователь ранее отклонил наш запрос на показ уведомлений
        // В этом месте мы можем, но не будем его беспокоить. Уважайте решения своих пользователей.
    }
}

function init() {
    populate();
    document.getElementById("addNewButton").addEventListener('click', addNew);
    document.getElementById("restoreDefaultsButton").addEventListener('click', restoreDefaults);
    document.getElementById("roeButton").addEventListener('click', removeOrEdit);

    document.getElementById("enableButton").addEventListener('click', function() {
        chrome.extension.getBackgroundPage().enable();
        sendNotification('Блокировка вредных сайтов', {
            body: 'Включена',
            icon: 'vkl.png',
            dir: 'auto'
        });
    });
    document.getElementById("disableButton").addEventListener('click', function() {
        chrome.extension.getBackgroundPage().disable();
        sendNotification('Блокировка вредных сайтов', {
            body: 'Отключена',
            icon: 'vblkl.png',
            dir: 'auto'
        });
    });
    document.getElementById("sortButton").addEventListener('click', sortFilters);
    document.getElementById("webRTCBox").addEventListener('click', checkMethod);
}

document.addEventListener('DOMContentLoaded', init);
