// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Auto-save functionality for during quiz attempts.
 *
 * @module tool_editrolesbycap/capabilityformfield
 * @copyright  2012 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import * as Str from 'core/str';

const ONE_HOURS = 60 * 60 * 1000;
const cookieName = 'captblflt';
let select = '';
let input = '';
let button = '';
let label = '';
let div = '';
let noneMessage = '';
let delayHandle = -1;
let searchDelay = 100;

/**
 * Render the search field element and initialize it's event handle.
 *
 * @param {String} selector
 */
export const initCapabilityFormField = async(selector) => {
    select = document.querySelector(selector);
    if (!select.length) {
        return;
    }

    const [
        nonematchString,
        filterString,
        clearString,
    ] = await Str.get_strings([
        {key: 'nonematch', component: 'tool_editrolesbycap'},
        {key: 'filter', component: 'moodle'},
        {key: 'clear', component: 'moodle'},
    ]);
    // Get any existing filter value.
    const filterValue = getFilterCookie();

    // Create a div to hold the search UI.
    div = document.createElement('div');
    div.setAttribute('class', 'capabilitysearchui form-inline m-t-1');
    div.setAttribute('style', 'width: ' + select.offsetWidth + 'px' + '; margin-left: auto; margin-right: auto;');

    // Create the capability search input.
    input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', select.getAttribute('id') + 'capabilitysearch');
    input.setAttribute('class', 'form-control');
    input.setAttribute('value', filterValue);

    // Create a label for the search input.
    label = document.createElement('label');
    label.appendChild(document.createTextNode(filterString));
    label.setAttribute('for', select.getAttribute('id') + 'capabilitysearch');

    // Create a clear button to clear the input.
    button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', clearString);
    enableDisableClearButton(filterValue);

    // Tie it all together.
    div.append(label);
    div.append(input);
    div.append(button);

    // Insert it into the container of the select.
    select.parentNode.append(div);

    noneMessage = document.createElement('optgroup');
    noneMessage.setAttribute('label', nonematchString);
    select.append(noneMessage);
    setVisible(noneMessage, false);

    // Wire the events so it actually does something.
    input.addEventListener('keyup', change);
    button.addEventListener('click', clear);

    if (filterValue !== '') {
        filter();
    }
};

/**
 * Sets a cookie that describes the filter value.
 * The cookie stores the context, and the time it was created and upon
 * retrieval is checked to ensure that the cookie is for the correct
 * context and is no more than an hour old.
 *
 * @param {String} cValue the value to store in the cookie.
 */
const setFilterCookie = (cValue) => {
    const d = new Date();
    d.setTime(d.getTime() + ONE_HOURS);
    let expires = "expires=" + d.toUTCString();
    document.cookie = cookieName + "=" + cValue + ";" + expires + ";path=/";
};


/**
 * Gets the existing filter value if there is one.
 * The cookie stores the context, and the time it was created and upon
 * retrieval is checked to ensure that the cookie is for the correct
 * context and is no more than an hour old.
 *
 * @return {String} value the value from the cookie.
 */
const getFilterCookie = () => {
    const name = cookieName + "=";
    const cookies = document.cookie.split(';');

    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return '';
};

/**
 * Filters the capability selector
 */
const filter = () => {
    const filterText = input.value.toLowerCase();
    setFilterCookie(filterText);
    enableDisableClearButton(filterText);
    let allHidden = true;
    select.querySelectorAll('optgroup').forEach((optgroup) => {
        setVisible(optgroup, false);
        const lastGroup = optgroup;

        optgroup.querySelectorAll('option').forEach((option) => {
            const capName = option.textContent.toLowerCase();
            if (capName.indexOf(filterText) >= 0) {
                setVisible(lastGroup, true);
                setVisible(option, true);
                allHidden = false;
            } else {
                setVisible(option, false);
            }
        });
    });
    if (allHidden) {
        setVisible(noneMessage, true);
    }
};

/**
 * Enable / Disable clear button base on filter value.
 *
 * @param {String} textValue
 */
const enableDisableClearButton = (textValue) => {
    if (textValue === '') {
        button.setAttribute('disabled', true);
    } else {
        button.removeAttribute('disabled');
    }
};

/**
 * Clears the filter value.
 */
const clear = () => {
    input.value = '';
    if (delayHandle !== -1) {
        clearTimeout(delayHandle);
        delayHandle = -1;
    }
    filter();
};

/**
 * Event callback for when the filter value changes
 */
const change = () => {
    let handle = setTimeout(function() {
        filter();
    }, searchDelay);
    if (delayHandle !== -1) {
        clearTimeout(delayHandle);
    }
    delayHandle = handle;
};

/**
 * Hide / Un-hide element.
 *
 * @param {Node} element
 * @param {bool} visible
 */
const setVisible = (element, visible) => {
    if (visible) {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
};
